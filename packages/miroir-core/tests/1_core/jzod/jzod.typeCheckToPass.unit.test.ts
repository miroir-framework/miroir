import * as vitest from 'vitest';
import { describe, expect, it } from 'vitest';


import type {
  JzodElement,
  JzodSchema,
  KeyMapEntry,
  TransformerTestSuite
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


import type { ResolvedJzodSchemaReturnType } from '../../../src/0_interfaces/1_core/jzodTypeCheckInterface';
import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import { jzodTypeCheck } from "../../../src/1_core/jzod/jzodTypeCheck";
import { getInnermostTypeCheckError } from "../../../src/1_core/jzod/mlsTypeCheckError";


// import { KeyMapEntry, miroirFundamentalJzodSchemaUuid } from '../../../dist';
import { defaultMiroirModelEnvironment } from '../../../src/1_core/Model';
import { MiroirActivityTracker } from '../../../src/3_controllers/MiroirActivityTracker';
import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  transformerTestsDisplayResults,
} from "../../../src/4_services/TestTools";
import { log } from 'console';
import { miroirFundamentalJzodSchemaUuid } from '../../../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers';


const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as JzodSchema;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const testSuiteName = "transformers.unit.test";

// Skip this test when running resolveConditionalSchema pattern
const shouldSkip = filePattern.includes('resolveConditionalSchema');

const extradisplayAttributes = {
  hidden: {
    definition: [
      {
        type: "boolean",
      },
      {
        definition: {
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "transformerForBuildPlusRuntime",
        },
        type: "schemaReference",
      },
    ],
    discriminator: "transformerType",
    optional: true,
    type: "union",
  },
  objectAttributesNoIndent: {
    optional: true,
    type: "boolean",
  },
  objectHideDeleteButton: {
    optional: true,
    type: "boolean",
  },
  objectHideOptionalButton: {
    optional: true,
    type: "boolean",
  },
  objectOrArrayWithoutFrame: {
    optional: true,
    type: "boolean",
  },
  objectUuidAttributeLabelPosition: {
    definition: ["left", "stacked", "hidden"],
    optional: true,
    type: "enum",
  },
  objectWithoutHeader: {
    optional: true,
    type: "boolean",
  },
  uuid: {
    optional: true,
    type: "object",
    definition: {
      selector: {
        definition: ["portalSelector", "muiSelector"],
        optional: true,
        type: "enum",
      },
    },
  },
};
// // ##################################################################################################
// export const transformerTestSuite_jzodTypeCheck: TransformerTestSuite = {
//   transformerTestType: "transformerTestSuite",
//   transformerTestLabel: "typeCheckToPass",
//   transformerTests: {
//     test010: {
//       transformerTestType: "transformerTest",
//       transformerTestLabel: "test010",
//       transformerName: "jzodTypeCheck",
//       runTestStep: "build",
//       transformer: {
//         transformerType: "jzodTypeCheck",
//         interpolation: "build",
//         jzodSchema: {
//           type: "literal",
//           definition: "myLiteral",
//         },
//         valueObject: "myLiteral"
//       },
//       transformerParams: {},
//       expectedValue: ["testA", "testB"],
//     },
//   },
// };

// const miroirActivityTracker = new MiroirActivityTracker();

// afterAll(() => {
//   if (!shouldSkip) {
//     transformerTestsDisplayResults(
//       transformerTestSuite_jzodTypeCheck,
//       filePattern || "",
//       testSuiteName,
//       miroirActivityTracker
//     );
//   }
// });
// // ################################################################################################

// if (shouldSkip) {
//   console.log("################################ skipping test suite:", testSuiteName);
//   console.log("################################ File pattern:", filePattern);
// } else {
//   await runTransformerTestSuite(
//     vitest,
//     [],
//     transformerTestSuite_jzodTypeCheck,
//     undefined, // filter
//     runTransformerTestInMemory,
//     defaultMiroirModelEnvironment,
//     miroirActivityTracker
//   );
  
// }





// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################

function replacer(key: string, value: any) {
  if (value instanceof Set) {
  return Array.from(value);
  }
  return value;
}

function testResolve(
  testId: string,
  testSchema: JzodElement,
  testValueObject: any,
  expectedResult?: ResolvedJzodSchemaReturnType | undefined,
  expectedResolvedSchema?: JzodElement,
  expectedSubSchemas:
  | ResolvedJzodSchemaReturnType
  | ResolvedJzodSchemaReturnType[]
  | Record<string, ResolvedJzodSchemaReturnType>
  | undefined = undefined,
  expectedKeyMap?: Record<string, { rawSchema: JzodElement; resolvedSchema: JzodElement }>,
  ignoreResolvedSchemaTag: boolean = false, 
) {
  console.log(
    "####################################################################### running test",
    testId,
    "..."
  );
  const testResult = jzodTypeCheck(
    testSchema,
    testValueObject,
    [], // currentValuePath
    [], // currentTypePath
    defaultMiroirModelEnvironment,
    {}
  );
  if (expectedResult) {
    expect(testResult, testId).toEqual(expectedResult);
  }
  // console.log("test", testId, "has result", testResult, );
  if (testResult.status !== "ok") { // defensive code, never happens
    console.log("test", testId, "failed with status", testResult.status, "and error", JSON.stringify(getInnermostTypeCheckError(testResult), null, 2));
    // throw new Error(
    //   `Test ${testId} failed with status ${testResult.status}: ${JSON.stringify(testResult.error)}`
    // );
    expect(testResult.status, testId).toEqual("ok"); // will always fail
    return;
  }
  expect(testResult.status, testId).toEqual("ok");
  console.log("test", testId, "has resolvedSchema", JSON.stringify(testResult.resolvedSchema, replacer, 2));
  // if (ignoreResolvedSchemaTag) {
  //   if (testResult.resolvedSchema.tag) delete testResult.resolvedSchema.tag;
  //   if (expectedResolvedSchema?.tag) delete expectedResolvedSchema?.tag
  // }
  expect(testResult.resolvedSchema, testId).toEqual(expectedResolvedSchema);
  if (expectedSubSchemas !== undefined) {
    // console.log("test", testId, "has subSchema", JSON.stringify(testResult.subSchemas, null, 2));
    expect(testResult.subSchemas, testId).toEqual(expectedSubSchemas);
  }
  if (expectedKeyMap !== undefined) {
    // Helper to convert Set to Array for JSON.stringify
    console.log("test", testId, "has keyMap", JSON.stringify(testResult.keyMap, replacer, 2));
    expect(testResult.keyMap, testId).toEqual(expectedKeyMap);
  }
}

interface testFormat {
  testSchema: JzodElement;
  testValueObject: any;
  expectedResult?: ResolvedJzodSchemaReturnType | undefined,
  expectedResolvedSchema?: JzodElement;
  expectedKeyMap?: Record<string, KeyMapEntry>;
  expectedSubSchema?:
    | ResolvedJzodSchemaReturnType
    | ResolvedJzodSchemaReturnType[]
    | Record<string, ResolvedJzodSchemaReturnType>
    | undefined;
  ignoreResolvedSchemaTag?: boolean, 
}


// ################################################################################################
// ################################################################################################
const tests: { [k: string]: testFormat } = {
  // // plain literal!
  // test010: {
  //   testSchema: {
  //     type: "literal",
  //     definition: "myLiteral",
  //   },
  //   expectedResolvedSchema: {
  //     type: "literal",
  //     definition: "myLiteral",
  //   },
  //   testValueObject: "myLiteral",
  // },
  // // simpleType: string
  // test012: {
  //   testSchema: {
  //     type: "any",
  //   },
  //   expectedResolvedSchema: {
  //     type: "any",
  //   },
  //   testValueObject: null,
  //   expectedKeyMap: { "": { rawSchema: { type: "any" }, resolvedSchema: { type: "any" }, valuePath: [], typePath: [] } },
  // },
  // // simpleType: string
  // test020: {
  //   testSchema: {
  //     type: "string",
  //   },
  //   expectedResolvedSchema: {
  //     type: "string",
  //   },
  //   testValueObject: "myString",
  // },
  // // simpleType: boolean TRUE
  // test022: {
  //   testSchema: {
  //     type: "boolean",
  //   },
  //   expectedResolvedSchema: {
  //     type: "boolean",
  //   },
  //   testValueObject: true,
  // },
  // // simpleType: boolean TRUE
  // test024: {
  //   testSchema: {
  //     type: "boolean",
  //   },
  //   expectedResolvedSchema: {
  //     type: "boolean",
  //   },
  //   testValueObject: false,
  // },
  // // schemaReference (plain, simpleType, non-recursive)
  // test030: {
  //   testSchema: {
  //     type: "schemaReference",
  //     context: {
  //       a: {
  //         type: "string",
  //       },
  //     },
  //     definition: {
  //       relativePath: "a",
  //     },
  //   },
  //   expectedResolvedSchema: {
  //     type: "string",
  //   },
  //   testValueObject: "myString",
  // },
  // // schemaReference: object, recursive, 1-level valueObject
  // test040: {
  //   testValueObject: { a: "myString", c: 42 },
  //   testSchema: {
  //     type: "schemaReference",
  //     context: {
  //       myObject: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "union",
  //             // optional: true,
  //             definition: [
  //               {
  //                 type: "string",
  //                 optional: true,
  //               },
  //               {
  //                 type: "schemaReference",
  //                 definition: { relativePath: "myObject" },
  //               },
  //             ],
  //           },
  //           b: {
  //             type: "string",
  //             optional: true,
  //           },
  //           c: {
  //             type: "number",
  //             optional: true,
  //           },
  //         },
  //       },
  //     },
  //     definition: { relativePath: "myObject" },
  //   },
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       a: {
  //         type: "string",
  //         optional: true,
  //       },
  //       c: {
  //         type: "number",
  //         optional: true,
  //       },
  //     },
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   a: {
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                   optional: true,
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //             b: {
  //   //               type: "string",
  //   //               optional: true,
  //   //             },
  //   //             c: {
  //   //               type: "number",
  //   //               optional: true,
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: ["myObject"],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //       optional: true,
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //       optional: true,
  //   //     },
  //   //     valuePath: ["a"],
  //   //     typePath: ["ref:myObject", "a"],
  //   //   },
  //   //   c: {
  //   //     rawSchema: {
  //   //       type: "number",
  //   //       optional: true,
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "number",
  //   //       optional: true,
  //   //     },
  //   //     valuePath: ["c"],
  //   //     typePath: ["ref:myObject", "c"],
  //   //   },
  //   //   "": {
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       context: {
  //   //         myObject: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                   optional: true,
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //             b: {
  //   //               type: "string",
  //   //               optional: true,
  //   //             },
  //   //             c: {
  //   //               type: "number",
  //   //               optional: true,
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //         c: {
  //   //           type: "number",
  //   //           optional: true,
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //               optional: true,
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //         b: {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //         c: {
  //   //           type: "number",
  //   //           optional: true,
  //   //         },
  //   //       },
  //   //     },
  //   //     valuePath: [],
  //   //     typePath: [],
  //   //   },
  //   // },
  // },
  // // schemaReference: object, recursive, 2-level valueObject
  // test050: {
  //   testValueObject: { a: { a: "myString" } },
  //   testSchema: {
  //     type: "schemaReference",
  //     context: {
  //       myObject: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "union",
  //             discriminator: "type",
  //             definition: [
  //               {
  //                 type: "string",
  //               },
  //               {
  //                 type: "schemaReference",
  //                 definition: { relativePath: "myObject" },
  //               },
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     definition: { relativePath: "myObject" },
  //   },
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       a: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "string",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   expectedKeyMap: undefined,
  //   //  {
  //   //   "a.a": {
  //   //     typePath: ["a", "a"],
  //   //     valuePath: ["a", "a"],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       discriminator: "type",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               discriminator: "type",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //       discriminator: "type",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   a: {
  //   //     typePath: ["a"],
  //   //     valuePath: ["a"],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       discriminator: "type",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           discriminator: "type",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               discriminator: "type",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //       discriminator: "type",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           discriminator: "type",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [],
  //   //     discriminator: "type",
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       context: {
  //   //         myObject: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               discriminator: "type",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           discriminator: "type",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   // },
  // },
  // // schemaReference: object, recursive, 3-level valueObject
  // test060: {
  //   testValueObject: { a: { a: { a: "myString" } } },
  //   testSchema: {
  //     type: "schemaReference",
  //     context: {
  //       myObject: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "union",
  //             definition: [
  //               {
  //                 type: "string",
  //               },
  //               {
  //                 type: "schemaReference",
  //                 definition: { relativePath: "myObject" },
  //               },
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     definition: { relativePath: "myObject" },
  //   },
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       a: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "object",
  //             definition: {
  //               a: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  //   expectedKeyMap: undefined,
  //   //  {
  //   //   "a.a.a": {
  //   //     typePath: ["a", "a"],
  //   //     valuePath: ["a", "a"],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "a.a": {
  //   //     typePath: ["a", "a"],
  //   //     valuePath: ["a", "a"],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [],
  //   //   },
  //   //   a: {
  //   //     typePath: ["a", "a"],
  //   //     valuePath: ["a", "a"],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [],
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       context: {
  //   //         myObject: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "object",
  //   //               definition: {
  //   //                 a: {
  //   //                   type: "string",
  //   //                 },
  //   //               },
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   // },
  // },
  // // schemaReference: record of recursive object, with 2-level valueObject
  // test070: {
  //   testSchema: {
  //     type: "schemaReference",
  //     context: {
  //       myObject: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "union",
  //             definition: [
  //               {
  //                 type: "string",
  //               },
  //               {
  //                 type: "schemaReference",
  //                 definition: { relativePath: "myObject" },
  //               },
  //             ],
  //           },
  //         },
  //       },
  //       myRecord: {
  //         type: "record",
  //         definition: {
  //           type: "schemaReference",
  //           definition: { relativePath: "myObject" },
  //         },
  //       },
  //     },
  //     definition: { relativePath: "myRecord" },
  //   },
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       r1: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "object",
  //             definition: {
  //               a: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //         },
  //       },
  //       r2: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "string",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   testValueObject: { r1: { a: { a: "myString" } }, r2: { a: "myString" } },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   "r1.a.a": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "r1.a": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [],
  //   //   },
  //   //   r1: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   //   "r2.a": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   r2: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       context: {
  //   //         myObject: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //         myRecord: {
  //   //           type: "record",
  //   //           definition: {
  //   //             type: "schemaReference",
  //   //             definition: {
  //   //               relativePath: "myObject",
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //       definition: {
  //   //         relativePath: "myRecord",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         r1: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "object",
  //   //               definition: {
  //   //                 a: {
  //   //                   type: "string",
  //   //                 },
  //   //               },
  //   //             },
  //   //           },
  //   //         },
  //   //         r2: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   // },
  // },
  // // result must be identical to test70, but this time the schemaReference is places inside the record, not the other way around
  // test080: {
  //   testSchema: {
  //     type: "record",
  //     definition: {
  //       type: "schemaReference",
  //       context: {
  //         myObject: {
  //           type: "object",
  //           definition: {
  //             a: {
  //               type: "union",
  //               definition: [
  //                 {
  //                   type: "string",
  //                 },
  //                 {
  //                   type: "schemaReference",
  //                   definition: { relativePath: "myObject" },
  //                 },
  //               ],
  //             },
  //           },
  //         },
  //       },
  //       definition: { relativePath: "myObject" },
  //     },
  //   },
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       r1: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "object",
  //             definition: {
  //               a: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //         },
  //       },
  //       r2: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "string",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   testValueObject: { r1: { a: { a: "myString" } }, r2: { a: "myString" } },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   "r1.a.a": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "r1.a": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [],
  //   //   },
  //   //   r1: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       context: {
  //   //         myObject: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   //   "r2.a": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   r2: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       context: {
  //   //         myObject: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "record",
  //   //       definition: {
  //   //         type: "schemaReference",
  //   //         context: {
  //   //           myObject: {
  //   //             type: "object",
  //   //             definition: {
  //   //               a: {
  //   //                 type: "union",
  //   //                 definition: [
  //   //                   {
  //   //                     type: "string",
  //   //                   },
  //   //                   {
  //   //                     type: "schemaReference",
  //   //                     definition: {
  //   //                       relativePath: "myObject",
  //   //                     },
  //   //                   },
  //   //                 ],
  //   //               },
  //   //             },
  //   //           },
  //   //         },
  //   //         definition: {
  //   //           relativePath: "myObject",
  //   //         },
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         r1: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "object",
  //   //               definition: {
  //   //                 a: {
  //   //                   type: "string",
  //   //                 },
  //   //               },
  //   //             },
  //   //           },
  //   //         },
  //   //         r2: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   // },
  // },
  // // array of simpleType
  // test090: {
  //   testValueObject: ["1", "2", "3"],
  //   testSchema: {
  //     type: "array",
  //     definition: {
  //       type: "string",
  //     },
  //   },
  //   expectedResolvedSchema: {
  //     type: "tuple",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "string",
  //       },
  //     ],
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   "0": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "1": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "2": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "array",
  //   //       definition: {
  //   //         type: "string",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //       ],
  //   //     },
  //   //   },
  //   // },
  // },
  // // array of schemaReference / object
  // test100: {
  //   testValueObject: [{ a: "myString" }],
  //   testSchema: {
  //     type: "array",
  //     definition: {
  //       type: "schemaReference",
  //       context: {
  //         myObject: {
  //           type: "object",
  //           definition: {
  //             a: {
  //               type: "union",
  //               definition: [
  //                 {
  //                   type: "string",
  //                 },
  //                 {
  //                   type: "schemaReference",
  //                   definition: { relativePath: "myObject" },
  //                 },
  //               ],
  //             },
  //           },
  //         },
  //       },
  //       definition: { relativePath: "myObject" },
  //     },
  //   },
  //   expectedResolvedSchema: {
  //     type: "tuple",
  //     definition: [
  //       {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "string",
  //           },
  //         },
  //       },
  //     ],
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   "0": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       context: {
  //   //         myObject: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "schemaReference",
  //   //               definition: {
  //   //                 relativePath: "myObject",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   //   "0.a": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "schemaReference",
  //   //                   definition: {
  //   //                     relativePath: "myObject",
  //   //                   },
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "array",
  //   //       definition: {
  //   //         type: "schemaReference",
  //   //         context: {
  //   //           myObject: {
  //   //             type: "object",
  //   //             definition: {
  //   //               a: {
  //   //                 type: "union",
  //   //                 definition: [
  //   //                   {
  //   //                     type: "string",
  //   //                   },
  //   //                   {
  //   //                     type: "schemaReference",
  //   //                     definition: {
  //   //                       relativePath: "myObject",
  //   //                     },
  //   //                   },
  //   //                 ],
  //   //               },
  //   //             },
  //   //           },
  //   //         },
  //   //         definition: {
  //   //           relativePath: "myObject",
  //   //         },
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //   },
  //   // },
  // },
  // // array of schemaReference / object
  // test110: {
  //   testSchema: {
  //     type: "schemaReference",
  //     context: {
  //       myObjectRoot: {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "string",
  //           },
  //         },
  //       },
  //       myObject: {
  //         type: "object",
  //         extend: {
  //           type: "schemaReference",
  //           definition: {
  //             relativePath: "myObjectRoot",
  //           },
  //         },
  //         definition: {
  //           b: {
  //             type: "string",
  //             optional: true,
  //           },
  //         },
  //       },
  //     },
  //     definition: { relativePath: "myObject" },
  //   },
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       a: {
  //         type: "string",
  //       },
  //       b: {
  //         type: "string",
  //         optional: true,
  //       },
  //     },
  //   },
  //   testValueObject: { a: "myString", b: "anotherString" },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   a: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   b: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //       optional: true,
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //       optional: true,
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "schemaReference",
  //   //       context: {
  //   //         myObjectRoot: {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //         myObject: {
  //   //           type: "object",
  //   //           extend: {
  //   //             type: "schemaReference",
  //   //             definition: {
  //   //               relativePath: "myObjectRoot",
  //   //             },
  //   //           },
  //   //           definition: {
  //   //             b: {
  //   //               type: "string",
  //   //               optional: true,
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //       definition: {
  //   //         relativePath: "myObject",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //         b: {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //         b: {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   // },
  // },
  // // simple union Type
  // test120: {
  //   testValueObject: 1, // this is the object
  //   testSchema: {
  //     type: "union",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "number",
  //       },
  //     ],
  //   },
  //   expectedResolvedSchema: {
  //     type: "number",
  //   },
  //   expectedKeyMap: {
  //     "": {
  //       typePath: [],
  //       valuePath: [],
  //       rawSchema: {
  //         type: "union",
  //         definition: [
  //           {
  //             type: "string",
  //           },
  //           {
  //             type: "number",
  //           },
  //         ],
  //       },
  //       recursivelyUnfoldedUnionSchema: {
  //         status: "ok",
  //         result: [
  //           {
  //             type: "string",
  //           },
  //           {
  //             type: "number",
  //           },
  //         ],
  //         expandedReferences: new Set(),
  //       },
  //       resolvedSchema: {
  //         type: "number",
  //       },
  //       chosenUnionBranchRawSchema: {
  //         type: "number",
  //       },
  //     },
  //   },
  // },
  // // union between simpleType and object, object value
  // test130: {
  //   testValueObject: { a: "myString" }, // this is the object
  //   testSchema: {
  //     type: "union",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "string",
  //           },
  //         },
  //       },
  //     ],
  //   },
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       a: {
  //         type: "string",
  //       },
  //     },
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   a: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(),
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [],
  //   //   },
  //   // },
  // },
  // // union between simpleType and object, simpleType value
  // test140: {
  //   testSchema: {
  //     type: "union",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "bigint",
  //       },
  //       {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "string",
  //           },
  //         },
  //       },
  //     ],
  //   },
  //   testValueObject: 42n, // this is the bigint
  //   expectedResolvedSchema: {
  //     type: "bigint",
  //   },
  //   expectedKeyMap: {
  //     "": {
  //       typePath: [],
  //       valuePath: [],
  //       rawSchema: {
  //         type: "union",
  //         definition: [
  //           {
  //             type: "string",
  //           },
  //           {
  //             type: "bigint",
  //           },
  //           {
  //             type: "object",
  //             definition: {
  //               a: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //         ],
  //       },
  //       recursivelyUnfoldedUnionSchema: {
  //         status: "ok",
  //         result: [
  //           {
  //             type: "string",
  //           },
  //           {
  //             type: "bigint",
  //           },
  //           {
  //             type: "object",
  //             definition: {
  //               a: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //         ],
  //         expandedReferences: new Set(),
  //       },
  //       resolvedSchema: {
  //         type: "bigint",
  //       },
  //       chosenUnionBranchRawSchema: {
  //         type: "bigint",
  //       },
  //     },
  //   },
  // },
  // // union between simpleType and object, object value
  // test150: {
  //   testSchema: {
  //     type: "union",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "bigint",
  //       },
  //       {
  //         type: "object",
  //         definition: {
  //           a: {
  //             type: "string",
  //           },
  //         },
  //       },
  //     ],
  //   },
  //   testValueObject: { a: "test" }, // this is the bigint
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       a: {
  //         type: "string",
  //       },
  //     },
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   a: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "bigint",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "bigint",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             a: {
  //   //               type: "string",
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(),
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [],
  //   //   },
  //   // },
  // },
  // // union between simpleType and shemaReference pointing to a simple object, object value
  // test160: {
  //   testSchema: {
  //     type: "union",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "bigint",
  //       },
  //       {
  //         type: "schemaReference",
  //         context: {
  //           myObject: {
  //             type: "object",
  //             definition: {
  //               b: {
  //                 type: "string",
  //                 optional: true,
  //               },
  //             },
  //           },
  //         },
  //         definition: { relativePath: "myObject" },
  //       },
  //     ],
  //   },
  //   testValueObject: { b: "test" }, // this is the object
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       b: {
  //         type: "string",
  //         optional: true,
  //       },
  //     },
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   b: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //       optional: true,
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //       optional: true,
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "bigint",
  //   //         },
  //   //         {
  //   //           type: "schemaReference",
  //   //           context: {
  //   //             myObject: {
  //   //               type: "object",
  //   //               definition: {
  //   //                 b: {
  //   //                   type: "string",
  //   //                   optional: true,
  //   //                 },
  //   //               },
  //   //             },
  //   //           },
  //   //           definition: {
  //   //             relativePath: "myObject",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         b: {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         b: {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "bigint",
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             b: {
  //   //               type: "string",
  //   //               optional: true,
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(["myObject"]),
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         b: {
  //   //           type: "string",
  //   //           optional: true,
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [],
  //   //   },
  //   // },
  // },
  // // 2-level simple unions of simple objects, 2-levelobject value
  // test170: {
  //   testSchema: {
  //     type: "union",
  //     discriminator: "objectType",
  //     definition: [
  //       {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "objectA",
  //           },
  //           a: {
  //             type: "union",
  //             definition: [
  //               {
  //                 type: "string",
  //               },
  //               {
  //                 type: "number",
  //               },
  //             ],
  //           },
  //         },
  //       },
  //       {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "objectB",
  //           },
  //           b: {
  //             type: "union",
  //             definition: [
  //               {
  //                 type: "boolean",
  //               },
  //               { type: "bigint" },
  //             ],
  //           },
  //         },
  //       },
  //     ],
  //   },
  //   testValueObject: { objectType: "objectA", a: "test" },
  //   expectedResolvedSchema: {
  //     type: "object",
  //     definition: {
  //       objectType: {
  //         type: "literal",
  //         definition: "objectA",
  //       },
  //       a: {
  //         type: "string",
  //       },
  //     },
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   objectType: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "literal",
  //   //       definition: "objectA",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "literal",
  //   //       definition: "objectA",
  //   //     },
  //   //   },
  //   //   a: {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "number",
  //   //         },
  //   //       ],
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "number",
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(),
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "union",
  //   //       discriminator: "objectType",
  //   //       definition: [
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             objectType: {
  //   //               type: "literal",
  //   //               definition: "objectA",
  //   //             },
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "number",
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             objectType: {
  //   //               type: "literal",
  //   //               definition: "objectB",
  //   //             },
  //   //             b: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "boolean",
  //   //                 },
  //   //                 {
  //   //                   type: "bigint",
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         objectType: {
  //   //           type: "literal",
  //   //           definition: "objectA",
  //   //         },
  //   //         a: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     jzodObjectFlattenedSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         objectType: {
  //   //           type: "literal",
  //   //           definition: "objectA",
  //   //         },
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "number",
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     recursivelyUnfoldedUnionSchema: {
  //   //       status: "ok",
  //   //       result: [
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             objectType: {
  //   //               type: "literal",
  //   //               definition: "objectA",
  //   //             },
  //   //             a: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "string",
  //   //                 },
  //   //                 {
  //   //                   type: "number",
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //         {
  //   //           type: "object",
  //   //           definition: {
  //   //             objectType: {
  //   //               type: "literal",
  //   //               definition: "objectB",
  //   //             },
  //   //             b: {
  //   //               type: "union",
  //   //               definition: [
  //   //                 {
  //   //                   type: "boolean",
  //   //                 },
  //   //                 {
  //   //                   type: "bigint",
  //   //                 },
  //   //               ],
  //   //             },
  //   //           },
  //   //         },
  //   //       ],
  //   //       expandedReferences: new Set(),
  //   //       discriminator: "objectType",
  //   //     },
  //   //     chosenUnionBranchRawSchema: {
  //   //       type: "object",
  //   //       definition: {
  //   //         objectType: {
  //   //           type: "literal",
  //   //           definition: "objectA",
  //   //         },
  //   //         a: {
  //   //           type: "union",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "number",
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //     discriminatorValues: [["objectA", "objectB"]],
  //   //     discriminator: "objectType",
  //   //   },
  //   // },
  // },
  // // TODO: union between simpleTypes and array with simpleType value
  // // TODO: union between simpleTypes and array with array value
  // // TODO: union between simpleTypes and array and object with array value
  // // TODO: union between simpleTypes and array and object with simpleType value
  // // TODO: union between simpleTypes and array and object with object value
  // // TODO: failing for union between simpleTypes, with object value
  // // TODO: union between simpleType and shemaReference pointing to an extended object, object value
  // // #############################################################################################
  // // #############################################################################################
  // // #############################################################################################
  // // #############################################################################################
  // // #############################################################################################
  // // #############################################################################################
  // // #############################################################################################
  // // #############################################################################################
  // // array of strings
  // test180: {
  //   testValueObject: ["1", "2", "3"],
  //   testSchema: {
  //     type: "array",
  //     definition: {
  //       type: "string",
  //     },
  //   },
  //   expectedResolvedSchema: {
  //     type: "tuple",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "string",
  //       },
  //     ],
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   "0": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "1": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "2": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "array",
  //   //       definition: {
  //   //         type: "string",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //       ],
  //   //     },
  //   //   },
  //   // },
  // },
  // // array of arrays of strings
  // test190: {
  //   testValueObject: [["1", "2"], ["3"]],
  //   testSchema: {
  //     type: "array",
  //     definition: {
  //       type: "array",
  //       definition: {
  //         type: "string",
  //       },
  //     },
  //   },
  //   expectedResolvedSchema: {
  //     type: "tuple",
  //     definition: [
  //       {
  //         type: "tuple",
  //         definition: [
  //           {
  //             type: "string",
  //           },
  //           {
  //             type: "string",
  //           },
  //         ],
  //       },
  //       {
  //         type: "tuple",
  //         definition: [
  //           {
  //             type: "string",
  //           },
  //         ],
  //       },
  //     ],
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   "0": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "array",
  //   //       definition: {
  //   //         type: "string",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //       ],
  //   //     },
  //   //   },
  //   //   "1": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "array",
  //   //       definition: {
  //   //         type: "string",
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //       ],
  //   //     },
  //   //   },
  //   //   "0.0": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "0.1": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "1.0": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "array",
  //   //       definition: {
  //   //         type: "array",
  //   //         definition: {
  //   //           type: "string",
  //   //         },
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "tuple",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //           ],
  //   //         },
  //   //         {
  //   //           type: "tuple",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //           ],
  //   //         },
  //   //       ],
  //   //     },
  //   //   },
  //   // },
  // },
  // // tuple of [string, number]
  // test200: {
  //   testSchema: {
  //     type: "tuple",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "number",
  //       },
  //     ],
  //   },
  //   expectedResolvedSchema: {
  //     type: "tuple",
  //     definition: [
  //       {
  //         type: "string",
  //       },
  //       {
  //         type: "number",
  //       },
  //     ],
  //   },
  //   testValueObject: ["myString", 42],
  //   expectedKeyMap: undefined,
  //   // {
  //   //   "0": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //   },
  //   //   "1": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "number",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "number",
  //   //     },
  //   //   },
  //   //   "": {
  //   //     typePath: [],
  //   //     valuePath: [],
  //   //     rawSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "number",
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "number",
  //   //         },
  //   //       ],
  //   //     },
  //   //   },
  //   // },
  // },
  // // array of tuples of [string, number, bigint]
  // test210: {
  //   testValueObject: [
  //     ["myString", 42, 100n],
  //     ["anotherString", 43, 101n],
  //   ],
  //   testSchema: {
  //     type: "array",
  //     definition: {
  //       type: "tuple",
  //       definition: [
  //         {
  //           type: "string",
  //         },
  //         {
  //           type: "number",
  //         },
  //         {
  //           type: "bigint",
  //         },
  //       ],
  //     },
  //   },
  //   expectedResolvedSchema: {
  //     type: "tuple",
  //     definition: [
  //       {
  //         type: "tuple",
  //         definition: [
  //           {
  //             type: "string",
  //           },
  //           {
  //             type: "number",
  //           },
  //           {
  //             type: "bigint",
  //           },
  //         ],
  //       },
  //       {
  //         type: "tuple",
  //         definition: [
  //           {
  //             type: "string",
  //           },
  //           {
  //             type: "number",
  //           },
  //           {
  //             type: "bigint",
  //           },
  //         ],
  //       },
  //     ],
  //   },
  //   expectedKeyMap: undefined,
  //   // {
  //   //   "0": {
  //   //     rawSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "number",
  //   //         },
  //   //         {
  //   //           type: "bigint",
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "number",
  //   //         },
  //   //         {
  //   //           type: "bigint",
  //   //         },
  //   //       ],
  //   //     },
  //   //     valuePath: [0],
  //   //     typePath: [0],
  //   //   },
  //   //   "1": {
  //   //     rawSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "number",
  //   //         },
  //   //         {
  //   //           type: "bigint",
  //   //         },
  //   //       ],
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "string",
  //   //         },
  //   //         {
  //   //           type: "number",
  //   //         },
  //   //         {
  //   //           type: "bigint",
  //   //         },
  //   //       ],
  //   //     },
  //   //     valuePath: [1],
  //   //     typePath: [1],
  //   //   },
  //   //   "0.0": {
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     valuePath: [0, 0],
  //   //     typePath: [0, 0],
  //   //   },
  //   //   "0.1": {
  //   //     rawSchema: {
  //   //       type: "number",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "number",
  //   //     },
  //   //     valuePath: [0, 1],
  //   //     typePath: [0, 1],
  //   //   },
  //   //   "0.2": {
  //   //     rawSchema: {
  //   //       type: "bigint",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "bigint",
  //   //     },
  //   //     valuePath: [0, 2],
  //   //     typePath: [0, 2],
  //   //   },
  //   //   "1.0": {
  //   //     rawSchema: {
  //   //       type: "string",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "string",
  //   //     },
  //   //     valuePath: [1, 0],
  //   //     typePath: [1, 0],
  //   //   },
  //   //   "1.1": {
  //   //     rawSchema: {
  //   //       type: "number",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "number",
  //   //     },
  //   //     valuePath: [1, 1],
  //   //     typePath: [1, 1],
  //   //   },
  //   //   "1.2": {
  //   //     rawSchema: {
  //   //       type: "bigint",
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "bigint",
  //   //     },
  //   //     valuePath: [1, 2],
  //   //     typePath: [1, 2],
  //   //   },
  //   //   "": {
  //   //     rawSchema: {
  //   //       type: "array",
  //   //       definition: {
  //   //         type: "tuple",
  //   //         definition: [
  //   //           {
  //   //             type: "string",
  //   //           },
  //   //           {
  //   //             type: "number",
  //   //           },
  //   //           {
  //   //             type: "bigint",
  //   //           },
  //   //         ],
  //   //       },
  //   //     },
  //   //     resolvedSchema: {
  //   //       type: "tuple",
  //   //       definition: [
  //   //         {
  //   //           type: "tuple",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "number",
  //   //             },
  //   //             {
  //   //               type: "bigint",
  //   //             },
  //   //           ],
  //   //         },
  //   //         {
  //   //           type: "tuple",
  //   //           definition: [
  //   //             {
  //   //               type: "string",
  //   //             },
  //   //             {
  //   //               type: "number",
  //   //             },
  //   //             {
  //   //               type: "bigint",
  //   //             },
  //   //           ],
  //   //         },
  //   //       ],
  //   //     },
  //   //     valuePath: [],
  //   //     typePath: [],
  //   //   },
  //   // },
  // },
  // // array of discriminated unions
  // test220: {
  //   testValueObject: [
  //     { objectType: "a", value: "myString" },
  //     { objectType: "b", value: 42 },
  //   ],
  //   testSchema: {
  //     type: "array",
  //     definition: {
  //       type: "union",
  //       discriminator: "objectType",
  //       definition: [
  //         {
  //           type: "object",
  //           definition: {
  //             objectType: {
  //               type: "literal",
  //               definition: "a",
  //             },
  //             value: {
  //               type: "string",
  //             },
  //           },
  //         },
  //         {
  //           type: "object",
  //           definition: {
  //             objectType: {
  //               type: "literal",
  //               definition: "b",
  //             },
  //             value: {
  //               type: "number",
  //             },
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   expectedResolvedSchema: {
  //     type: "tuple",
  //     definition: [
  //       {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "a",
  //           },
  //           value: {
  //             type: "string",
  //           },
  //         },
  //       },
  //       {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "b",
  //           },
  //           value: {
  //             type: "number",
  //           },
  //         },
  //       },
  //     ],
  //   },
  //   expectedKeyMap: {
  //     "0": {
  //       rawSchema: {
  //         type: "union",
  //         discriminator: "objectType",
  //         definition: [
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "a",
  //               },
  //               value: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "b",
  //               },
  //               value: {
  //                 type: "number",
  //               },
  //             },
  //           },
  //         ],
  //       },
  //       resolvedSchema: {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "a",
  //           },
  //           value: {
  //             type: "string",
  //           },
  //         },
  //       },
  //       jzodObjectFlattenedSchema: {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "a",
  //           },
  //           value: {
  //             type: "string",
  //           },
  //         },
  //       },
  //       valuePath: [0],
  //       typePath: [0, 'union choice([{"discriminator":"objectType","value":"a"}])'],
  //       recursivelyUnfoldedUnionSchema: {
  //         status: "ok",
  //         result: [
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "a",
  //               },
  //               value: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "b",
  //               },
  //               value: {
  //                 type: "number",
  //               },
  //             },
  //           },
  //         ],
  //         expandedReferences: new Set(),
  //         discriminator: "objectType",
  //       },
  //       chosenUnionBranchRawSchema: {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "a",
  //           },
  //           value: {
  //             type: "string",
  //           },
  //         },
  //       },
  //       discriminatorValues: [["a", "b"]],
  //       discriminator: "objectType",
  //     },
  //     "1": {
  //       rawSchema: {
  //         type: "union",
  //         discriminator: "objectType",
  //         definition: [
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "a",
  //               },
  //               value: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "b",
  //               },
  //               value: {
  //                 type: "number",
  //               },
  //             },
  //           },
  //         ],
  //       },
  //       resolvedSchema: {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "b",
  //           },
  //           value: {
  //             type: "number",
  //           },
  //         },
  //       },
  //       jzodObjectFlattenedSchema: {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "b",
  //           },
  //           value: {
  //             type: "number",
  //           },
  //         },
  //       },
  //       valuePath: [1],
  //       typePath: [1, 'union choice([{"discriminator":"objectType","value":"b"}])'],
  //       recursivelyUnfoldedUnionSchema: {
  //         status: "ok",
  //         result: [
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "a",
  //               },
  //               value: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "b",
  //               },
  //               value: {
  //                 type: "number",
  //               },
  //             },
  //           },
  //         ],
  //         expandedReferences: new Set(),
  //         discriminator: "objectType",
  //       },
  //       chosenUnionBranchRawSchema: {
  //         type: "object",
  //         definition: {
  //           objectType: {
  //             type: "literal",
  //             definition: "b",
  //           },
  //           value: {
  //             type: "number",
  //           },
  //         },
  //       },
  //       discriminatorValues: [["a", "b"]],
  //       discriminator: "objectType",
  //     },
  //     "0.objectType": {
  //       rawSchema: {
  //         type: "literal",
  //         definition: "a",
  //       },
  //       resolvedSchema: {
  //         type: "literal",
  //         definition: "a",
  //       },
  //       valuePath: [0, "objectType"],
  //       typePath: [0, 'union choice([{"discriminator":"objectType","value":"a"}])', "objectType"],
  //     },
  //     "0.value": {
  //       rawSchema: {
  //         type: "string",
  //       },
  //       resolvedSchema: {
  //         type: "string",
  //       },
  //       valuePath: [0, "value"],
  //       typePath: [0, 'union choice([{"discriminator":"objectType","value":"a"}])', "value"],
  //     },
  //     "1.objectType": {
  //       rawSchema: {
  //         type: "literal",
  //         definition: "b",
  //       },
  //       resolvedSchema: {
  //         type: "literal",
  //         definition: "b",
  //       },
  //       valuePath: [1, "objectType"],
  //       typePath: [1, 'union choice([{"discriminator":"objectType","value":"b"}])', "objectType"],
  //     },
  //     "1.value": {
  //       rawSchema: {
  //         type: "number",
  //       },
  //       resolvedSchema: {
  //         type: "number",
  //       },
  //       valuePath: [1, "value"],
  //       typePath: [1, 'union choice([{"discriminator":"objectType","value":"b"}])', "value"],
  //     },
  //     "": {
  //       rawSchema: {
  //         type: "array",
  //         definition: {
  //           type: "union",
  //           discriminator: "objectType",
  //           definition: [
  //             {
  //               type: "object",
  //               definition: {
  //                 objectType: {
  //                   type: "literal",
  //                   definition: "a",
  //                 },
  //                 value: {
  //                   type: "string",
  //                 },
  //               },
  //             },
  //             {
  //               type: "object",
  //               definition: {
  //                 objectType: {
  //                   type: "literal",
  //                   definition: "b",
  //                 },
  //                 value: {
  //                   type: "number",
  //                 },
  //               },
  //             },
  //           ],
  //         },
  //       },
  //       resolvedSchema: {
  //         type: "tuple",
  //         definition: [
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "a",
  //               },
  //               value: {
  //                 type: "string",
  //               },
  //             },
  //           },
  //           {
  //             type: "object",
  //             definition: {
  //               objectType: {
  //                 type: "literal",
  //                 definition: "b",
  //               },
  //               value: {
  //                 type: "number",
  //               },
  //             },
  //           },
  //         ],
  //       },
  //       valuePath: [],
  //       typePath: [],
  //     },
  //   },
  // },
  // union type for array of references
  test230: {
    testValueObject: [
      {
        type: "schemaReference",
        definition: {
          eager: true,
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "transformer_orderBy",
        },
      },
    ],
    testSchema: {
      type: "union",
      optional: true,
      definition: [
        {
          type: "union",
          optional: true,
          discriminator: "type",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodReference",
              },
              context: {},
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodObject",
              },
              context: {},
            },
          ],
        },
        {
          type: "array",
          definition: {
            type: "union",
            optional: true,
            discriminator: "type",
            definition: [
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodReference",
                },
                context: {},
              },
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodObject",
                },
                context: {},
              },
            ],
          },
        },
      ],
    },
    expectedResolvedSchema: {
      type: "tuple",
      optional: true,
      definition: [
        {
          type: "object",
          definition: {
            type: {
              type: "literal",
              tag: {
                value: {
                  canBeTemplate: false,
                },
              },
              definition: "schemaReference",
            },
            definition: {
              type: "object",
              definition: {
                eager: {
                  type: "boolean",
                  optional: true,
                },
                absolutePath: {
                  type: "string",
                  optional: true,
                },
                relativePath: {
                  type: "string",
                },
              },
            },
          },
          tag: {
            optional: true,
            schema: {
              optional: true,
              metaSchema: {
                type: "object",
                optional: true,
                definition: {
                  optional: {
                    type: "boolean",
                    optional: true,
                  },
                  metaSchema: {
                    type: "schemaReference",
                    optional: true,
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodElement",
                    },
                  },
                  valueSchema: {
                    type: "schemaReference",
                    optional: true,
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodElement",
                    },
                  },
                },
              },
              valueSchema: {
                type: "object",
                optional: true,
                definition: {
                  id: {
                    type: "number",
                    optional: true,
                  },
                  defaultLabel: {
                    type: "string",
                    optional: true,
                  },
                  description: {
                    type: "string",
                    optional: true,
                  },
                  editorButton: {
                    type: "object",
                    optional: true,
                    definition: {
                      icon: {
                        type: "string",
                        optional: true,
                      },
                      label: {
                        type: "string",
                        optional: true,
                      },
                      tooltip: {
                        type: "string",
                        optional: true,
                      },
                      transformer: {
                        type: "any",
                        tag: {
                          value: {
                            ifThenElseMMLS: {
                              mmlsReference: {
                                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                relativePath: "transformerForBuildPlusRuntime",
                              },
                            },
                          },
                        },
                        optional: true,
                      },
                    },
                  },
                  initializeTo: {
                    type: "union",
                    discriminator: "initializeToType",
                    optional: true,
                    definition: [
                      {
                        type: "object",
                        optional: true,
                        definition: {
                          initializeToType: {
                            type: "literal",
                            definition: "value",
                          },
                          value: {
                            type: "any",
                            optional: true,
                          },
                        },
                      },
                      {
                        type: "object",
                        optional: true,
                        definition: {
                          initializeToType: {
                            type: "literal",
                            definition: "transformer",
                          },
                          transformer: {
                            type: "any",
                            tag: {
                              value: {
                                ifThenElseMMLS: {
                                  mmlsReference: {
                                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                    relativePath: "transformerForBuildPlusRuntime",
                                  },
                                },
                              },
                            },
                            optional: true,
                          },
                        },
                      },
                    ],
                  },
                  isBlob: {
                    type: "boolean",
                    optional: true,
                  },
                  selectorParams: {
                    type: "object",
                    optional: true,
                    definition: {
                      targetApplicationUuid: {
                        type: "uuid",
                        optional: true,
                      },
                      targetDeploymentUuid: {
                        type: "uuid",
                        optional: true,
                      },
                      targetEntityApplicationSection: {
                        type: "enum",
                        optional: true,
                        definition: ["model", "data", "metaModel"],
                      },
                      targetEntity: {
                        type: "uuid",
                      },
                      targetEntityOrderInstancesBy: {
                        type: "string",
                        optional: true,
                      },
                    },
                  },
                  targetEntity: {
                    type: "string",
                    optional: true,
                  },
                  targetEntityOrderInstancesBy: {
                    type: "string",
                    optional: true,
                  },
                  targetEntityApplicationSection: {
                    type: "enum",
                    optional: true,
                    definition: ["model", "data", "metaModel"],
                  },
                  editable: {
                    type: "boolean",
                    optional: true,
                  },
                  canBeTemplate: {
                    type: "boolean",
                    optional: true,
                  },
                  isTemplate: {
                    type: "boolean",
                    optional: true,
                  },
                  ifThenElseMMLS: {
                    type: "object",
                    optional: true,
                    definition: {
                      parentUuid: {
                        type: "union",
                        optional: true,
                        definition: [
                          {
                            type: "string",
                          },
                          {
                            type: "object",
                            definition: {
                              path: {
                                type: "union",
                                definition: [
                                  {
                                    type: "string",
                                  },
                                  {
                                    type: "object",
                                    definition: {
                                      defaultValuePath: {
                                        type: "string",
                                      },
                                      typeCheckPath: {
                                        type: "string",
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                      mmlsReference: {
                        type: "object",
                        optional: true,
                        definition: {
                          absolutePath: {
                            type: "string",
                            optional: true,
                          },
                          relativePath: {
                            type: "string",
                          },
                        },
                      },
                    },
                  },
                  display: {
                    type: "object",
                    optional: true,
                    definition: {
                      displayedAttributeValueWhenFolded: {
                        type: "string",
                        optional: true,
                      },
                      hidden: {
                        type: "union",
                        optional: true,
                        discriminator: "transformerType",
                        definition: [
                          {
                            type: "boolean",
                          },
                          {
                            type: "schemaReference",
                            tag: {
                              value: {
                                description:
                                  "A transformer that resolves to a boolean indicating whether the attribute is hidden.",
                                canBeTemplate: false,
                              },
                            },
                            definition: {
                              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              relativePath: "transformerForBuildPlusRuntime",
                            },
                          },
                        ],
                      },
                      editable: {
                        type: "boolean",
                        tag: {
                          value: {
                            description:
                              "Whether the attribute is editable in UIs upon instance creation.",
                            canBeTemplate: false,
                          },
                        },
                        optional: true,
                      },
                      modifiable: {
                        type: "boolean",
                        tag: {
                          value: {
                            description:
                              "Whether the attribute is modifiable in UIs after instance creation.",
                            canBeTemplate: false,
                          },
                        },
                        optional: true,
                      },
                      uuid: {
                        type: "object",
                        optional: true,
                        definition: {
                          selector: {
                            type: "enum",
                            optional: true,
                            definition: ["portalSelector", "muiSelector"],
                          },
                        },
                      },
                      objectUuidAttributeLabelPosition: {
                        type: "enum",
                        optional: true,
                        definition: ["left", "stacked", "hidden"],
                      },
                      objectHideDeleteButton: {
                        type: "boolean",
                        optional: true,
                      },
                      objectHideOptionalButton: {
                        type: "boolean",
                        optional: true,
                      },
                      objectWithoutHeader: {
                        type: "boolean",
                        optional: true,
                      },
                      objectAttributesNoIndent: {
                        type: "boolean",
                        optional: true,
                      },
                      objectOrArrayWithoutFrame: {
                        type: "boolean",
                        optional: true,
                      },
                      unfoldSubLevels: {
                        type: "number",
                        optional: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
    expectedKeyMap: undefined,
  },
  // union type for discriminated union with alternative discriminator
  test240: {
    testValueObject: [
      { kind: "circle", radius: 10 },
      { type: "square", sideLength: 5 },
    ],
    testSchema: {
      type: "array",
      definition: {
        type: "union",
        discriminator: [["kind", "type"]],
        definition: [
          {
            type: "object",
            definition: {
              kind: {
                type: "literal",
                definition: "circle",
              },
              radius: {
                type: "number",
              },
            },
          },
          {
            type: "object",
            definition: {
              type: {
                type: "literal",
                definition: "square",
              },
              sideLength: {
                type: "number",
              },
            },
          },
        ],
      },
    },
    expectedResolvedSchema: {
      type: "tuple",
      definition: [
        {
          type: "object",
          definition: {
            kind: {
              type: "literal",
              definition: "circle",
            },
            radius: {
              type: "number",
            },
          },
        },
        {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "square",
            },
            sideLength: {
              type: "number",
            },
          },
        },
      ],
    },
    expectedKeyMap: undefined,
  },
  // // ##########################################################################################
  // // ################################# JZOD SCHEMAS ###########################################
  // // ##########################################################################################
  // JzodSchema: literal
  test300: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "jzodElement",
      },
    },
    testValueObject: { type: "literal", definition: "myLiteral" },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        type: {
          type: "literal",
          tag: {
            value: {
              canBeTemplate: false,
            },
          },
          definition: "literal",
        },
        definition: {
          type: "string",
        },
      },
      tag: {
        optional: true,
        schema: {
          optional: true,
          metaSchema: {
            type: "object",
            optional: true,
            definition: {
              optional: {
                type: "boolean",
                optional: true,
              },
              metaSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
              valueSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
            },
          },
          valueSchema: {
            type: "object",
            optional: true,
            definition: {
              id: {
                type: "number",
                optional: true,
              },
              defaultLabel: {
                type: "string",
                optional: true,
              },
              description: {
                type: "string",
                optional: true,
              },
              editorButton: {
                type: "object",
                optional: true,
                definition: {
                  icon: {
                    type: "string",
                    optional: true,
                  },
                  label: {
                    type: "string",
                    optional: true,
                  },
                  tooltip: {
                    type: "string",
                    optional: true,
                  },
                  transformer: {
                    type: "any",
                    tag: {
                      value: {
                        ifThenElseMMLS: {
                          mmlsReference: {
                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            relativePath: "transformerForBuildPlusRuntime",
                          },
                        },
                      },
                    },
                    optional: true,
                  },
                },
              },
              initializeTo: {
                type: "union",
                discriminator: "initializeToType",
                optional: true,
                definition: [
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "value",
                      },
                      value: {
                        type: "any",
                        optional: true,
                      },
                    },
                  },
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "transformer",
                      },
                      transformer: {
                        type: "any",
                        tag: {
                          value: {
                            ifThenElseMMLS: {
                              mmlsReference: {
                                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                relativePath: "transformerForBuildPlusRuntime",
                              },
                            },
                          },
                        },
                        optional: true,
                      },
                    },
                  },
                ],
              },
              isBlob: {
                type: "boolean",
                optional: true,
              },
              selectorParams: {
                type: "object",
                optional: true,
                definition: {
                  targetApplicationUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetDeploymentUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetEntityApplicationSection: {
                    type: "enum",
                    optional: true,
                    definition: ["model", "data", "metaModel"],
                  },
                  targetEntity: {
                    type: "uuid",
                  },
                  targetEntityOrderInstancesBy: {
                    type: "string",
                    optional: true,
                  },
                },
              },
              targetEntity: {
                type: "string",
                optional: true,
              },
              targetEntityOrderInstancesBy: {
                type: "string",
                optional: true,
              },
              targetEntityApplicationSection: {
                type: "enum",
                optional: true,
                definition: ["model", "data", "metaModel"],
              },
              editable: {
                type: "boolean",
                optional: true,
              },
              canBeTemplate: {
                type: "boolean",
                optional: true,
              },
              isTemplate: {
                type: "boolean",
                optional: true,
              },
              ifThenElseMMLS: {
                type: "object",
                optional: true,
                definition: {
                  parentUuid: {
                    type: "union",
                    optional: true,
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "object",
                        definition: {
                          path: {
                            type: "union",
                            definition: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                definition: {
                                  defaultValuePath: {
                                    type: "string",
                                  },
                                  typeCheckPath: {
                                    type: "string",
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                  mmlsReference: {
                    type: "object",
                    optional: true,
                    definition: {
                      absolutePath: {
                        type: "string",
                        optional: true,
                      },
                      relativePath: {
                        type: "string",
                      },
                    },
                  },
                },
              },
              display: {
                type: "object",
                optional: true,
                definition: {
                  displayedAttributeValueWhenFolded: {
                    type: "string",
                    optional: true,
                  },
                  hidden: {
                    type: "union",
                    optional: true,
                    discriminator: "transformerType",
                    definition: [
                      {
                        type: "boolean",
                      },
                      {
                        type: "schemaReference",
                        tag: {
                          value: {
                            description:
                              "A transformer that resolves to a boolean indicating whether the attribute is hidden.",
                            canBeTemplate: false,
                          },
                        },
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "transformerForBuildPlusRuntime",
                        },
                      },
                    ],
                  },
                  editable: {
                    type: "boolean",
                    tag: {
                      value: {
                        description:
                          "Whether the attribute is editable in UIs upon instance creation.",
                        canBeTemplate: false,
                      },
                    },
                    optional: true,
                  },
                  modifiable: {
                    type: "boolean",
                    tag: {
                      value: {
                        description:
                          "Whether the attribute is modifiable in UIs after instance creation.",
                        canBeTemplate: false,
                      },
                    },
                    optional: true,
                  },
                  uuid: {
                    type: "object",
                    optional: true,
                    definition: {
                      selector: {
                        type: "enum",
                        optional: true,
                        definition: ["portalSelector", "muiSelector"],
                      },
                    },
                  },
                  objectUuidAttributeLabelPosition: {
                    type: "enum",
                    optional: true,
                    definition: ["left", "stacked", "hidden"],
                  },
                  objectHideDeleteButton: {
                    type: "boolean",
                    optional: true,
                  },
                  objectHideOptionalButton: {
                    type: "boolean",
                    optional: true,
                  },
                  objectWithoutHeader: {
                    type: "boolean",
                    optional: true,
                  },
                  objectAttributesNoIndent: {
                    type: "boolean",
                    optional: true,
                  },
                  objectOrArrayWithoutFrame: {
                    type: "boolean",
                    optional: true,
                  },
                  unfoldSubLevels: {
                    type: "number",
                    optional: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  //     // JzodSchema: string
  test310: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "jzodElement",
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        type: {
          type: "literal",
          tag: {
            value: {
              canBeTemplate: false,
            },
          },
          definition: "string",
        },
      },
      tag: {
        optional: true,
        schema: {
          optional: true,
          metaSchema: {
            type: "object",
            optional: true,
            definition: {
              optional: {
                type: "boolean",
                optional: true,
              },
              metaSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
              valueSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
            },
          },
          valueSchema: {
            type: "object",
            optional: true,
            definition: {
              id: {
                type: "number",
                optional: true,
              },
              defaultLabel: {
                type: "string",
                optional: true,
              },
              description: {
                type: "string",
                optional: true,
              },
              editorButton: {
                type: "object",
                optional: true,
                definition: {
                  icon: {
                    type: "string",
                    optional: true,
                  },
                  label: {
                    type: "string",
                    optional: true,
                  },
                  tooltip: {
                    type: "string",
                    optional: true,
                  },
                  transformer: {
                    type: "any",
                    tag: {
                      value: {
                        ifThenElseMMLS: {
                          mmlsReference: {
                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            relativePath: "transformerForBuildPlusRuntime",
                          },
                        },
                      },
                    },
                    optional: true,
                  },
                },
              },
              initializeTo: {
                type: "union",
                discriminator: "initializeToType",
                optional: true,
                definition: [
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "value",
                      },
                      value: {
                        type: "any",
                        optional: true,
                      },
                    },
                  },
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "transformer",
                      },
                      transformer: {
                        type: "any",
                        tag: {
                          value: {
                            ifThenElseMMLS: {
                              mmlsReference: {
                                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                relativePath: "transformerForBuildPlusRuntime",
                              },
                            },
                          },
                        },
                        optional: true,
                      },
                    },
                  },
                ],
              },
              isBlob: {
                type: "boolean",
                optional: true,
              },
              selectorParams: {
                type: "object",
                optional: true,
                definition: {
                  targetApplicationUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetDeploymentUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetEntityApplicationSection: {
                    type: "enum",
                    optional: true,
                    definition: ["model", "data", "metaModel"],
                  },
                  targetEntity: {
                    type: "uuid",
                  },
                  targetEntityOrderInstancesBy: {
                    type: "string",
                    optional: true,
                  },
                },
              },
              targetEntity: {
                type: "string",
                optional: true,
              },
              targetEntityOrderInstancesBy: {
                type: "string",
                optional: true,
              },
              targetEntityApplicationSection: {
                type: "enum",
                optional: true,
                definition: ["model", "data", "metaModel"],
              },
              editable: {
                type: "boolean",
                optional: true,
              },
              canBeTemplate: {
                type: "boolean",
                optional: true,
              },
              isTemplate: {
                type: "boolean",
                optional: true,
              },
              ifThenElseMMLS: {
                type: "object",
                optional: true,
                definition: {
                  parentUuid: {
                    type: "union",
                    optional: true,
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "object",
                        definition: {
                          path: {
                            type: "union",
                            definition: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                definition: {
                                  defaultValuePath: {
                                    type: "string",
                                  },
                                  typeCheckPath: {
                                    type: "string",
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                  mmlsReference: {
                    type: "object",
                    optional: true,
                    definition: {
                      absolutePath: {
                        type: "string",
                        optional: true,
                      },
                      relativePath: {
                        type: "string",
                      },
                    },
                  },
                },
              },
              display: {
                type: "object",
                optional: true,
                definition: {
                  displayedAttributeValueWhenFolded: {
                    type: "string",
                    optional: true,
                  },
                  hidden: {
                    type: "union",
                    optional: true,
                    discriminator: "transformerType",
                    definition: [
                      {
                        type: "boolean",
                      },
                      {
                        type: "schemaReference",
                        tag: {
                          value: {
                            description:
                              "A transformer that resolves to a boolean indicating whether the attribute is hidden.",
                            canBeTemplate: false,
                          },
                        },
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "transformerForBuildPlusRuntime",
                        },
                      },
                    ],
                  },
                  editable: {
                    type: "boolean",
                    tag: {
                      value: {
                        description:
                          "Whether the attribute is editable in UIs upon instance creation.",
                        canBeTemplate: false,
                      },
                    },
                    optional: true,
                  },
                  modifiable: {
                    type: "boolean",
                    tag: {
                      value: {
                        description:
                          "Whether the attribute is modifiable in UIs after instance creation.",
                        canBeTemplate: false,
                      },
                    },
                    optional: true,
                  },
                  uuid: {
                    type: "object",
                    optional: true,
                    definition: {
                      selector: {
                        type: "enum",
                        optional: true,
                        definition: ["portalSelector", "muiSelector"],
                      },
                    },
                  },
                  objectUuidAttributeLabelPosition: {
                    type: "enum",
                    optional: true,
                    definition: ["left", "stacked", "hidden"],
                  },
                  objectHideDeleteButton: {
                    type: "boolean",
                    optional: true,
                  },
                  objectHideOptionalButton: {
                    type: "boolean",
                    optional: true,
                  },
                  objectWithoutHeader: {
                    type: "boolean",
                    optional: true,
                  },
                  objectAttributesNoIndent: {
                    type: "boolean",
                    optional: true,
                  },
                  objectOrArrayWithoutFrame: {
                    type: "boolean",
                    optional: true,
                  },
                  unfoldSubLevels: {
                    type: "number",
                    optional: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    testValueObject: { type: "string" },
    expectedKeyMap: undefined,
  },
  // JzodSchema: object, simpleType attributes
  test320: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "jzodElement",
      },
    },
    ignoreResolvedSchemaTag: true,
    expectedResolvedSchema: {
      type: "object",
      definition: {
        type: {
          type: "literal",
          tag: {
            value: {
              canBeTemplate: false,
            },
          },
          definition: "object",
        },
        definition: {
          type: "object",
          tag: {
            value: {
              description: "The attributes of the object schema.",
              editable: true,
            },
          },
          definition: {
            a: {
              type: "object",
              definition: {
                type: {
                  type: "literal",
                  tag: {
                    value: {
                      canBeTemplate: false,
                    },
                  },
                  definition: "string",
                },
              },
              tag: {
                optional: true,
                schema: {
                  optional: true,
                  metaSchema: {
                    type: "object",
                    optional: true,
                    definition: {
                      optional: {
                        type: "boolean",
                        optional: true,
                      },
                      metaSchema: {
                        type: "schemaReference",
                        optional: true,
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                      valueSchema: {
                        type: "schemaReference",
                        optional: true,
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  valueSchema: {
                    type: "object",
                    optional: true,
                    definition: {
                      id: {
                        type: "number",
                        optional: true,
                      },
                      defaultLabel: {
                        type: "string",
                        optional: true,
                      },
                      description: {
                        type: "string",
                        optional: true,
                      },
                      editorButton: {
                        type: "object",
                        optional: true,
                        definition: {
                          icon: {
                            type: "string",
                            optional: true,
                          },
                          label: {
                            type: "string",
                            optional: true,
                          },
                          tooltip: {
                            type: "string",
                            optional: true,
                          },
                          transformer: {
                            type: "any",
                            tag: {
                              value: {
                                ifThenElseMMLS: {
                                  mmlsReference: {
                                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                    relativePath: "transformerForBuildPlusRuntime",
                                  },
                                },
                              },
                            },
                            optional: true,
                          },
                        },
                      },
                      initializeTo: {
                        type: "union",
                        discriminator: "initializeToType",
                        optional: true,
                        definition: [
                          {
                            type: "object",
                            optional: true,
                            definition: {
                              initializeToType: {
                                type: "literal",
                                definition: "value",
                              },
                              value: {
                                type: "any",
                                optional: true,
                              },
                            },
                          },
                          {
                            type: "object",
                            optional: true,
                            definition: {
                              initializeToType: {
                                type: "literal",
                                definition: "transformer",
                              },
                              transformer: {
                                type: "any",
                                tag: {
                                  value: {
                                    ifThenElseMMLS: {
                                      mmlsReference: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath: "transformerForBuildPlusRuntime",
                                      },
                                    },
                                  },
                                },
                                optional: true,
                              },
                            },
                          },
                        ],
                      },
                      isBlob: {
                        type: "boolean",
                        optional: true,
                      },
                      selectorParams: {
                        type: "object",
                        optional: true,
                        definition: {
                          targetApplicationUuid: {
                            type: "uuid",
                            optional: true,
                          },
                          targetDeploymentUuid: {
                            type: "uuid",
                            optional: true,
                          },
                          targetEntityApplicationSection: {
                            type: "enum",
                            optional: true,
                            definition: ["model", "data", "metaModel"],
                          },
                          targetEntity: {
                            type: "uuid",
                          },
                          targetEntityOrderInstancesBy: {
                            type: "string",
                            optional: true,
                          },
                        },
                      },
                      targetEntity: {
                        type: "string",
                        optional: true,
                      },
                      targetEntityOrderInstancesBy: {
                        type: "string",
                        optional: true,
                      },
                      targetEntityApplicationSection: {
                        type: "enum",
                        optional: true,
                        definition: ["model", "data", "metaModel"],
                      },
                      editable: {
                        type: "boolean",
                        optional: true,
                      },
                      canBeTemplate: {
                        type: "boolean",
                        optional: true,
                      },
                      isTemplate: {
                        type: "boolean",
                        optional: true,
                      },
                      ifThenElseMMLS: {
                        type: "object",
                        optional: true,
                        definition: {
                          parentUuid: {
                            type: "union",
                            optional: true,
                            definition: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                definition: {
                                  path: {
                                    type: "union",
                                    definition: [
                                      {
                                        type: "string",
                                      },
                                      {
                                        type: "object",
                                        definition: {
                                          defaultValuePath: {
                                            type: "string",
                                          },
                                          typeCheckPath: {
                                            type: "string",
                                          },
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                          mmlsReference: {
                            type: "object",
                            optional: true,
                            definition: {
                              absolutePath: {
                                type: "string",
                                optional: true,
                              },
                              relativePath: {
                                type: "string",
                              },
                            },
                          },
                        },
                      },
                      display: {
                        type: "object",
                        optional: true,
                        definition: {
                          displayedAttributeValueWhenFolded: {
                            type: "string",
                            optional: true,
                          },
                          hidden: {
                            type: "union",
                            optional: true,
                            discriminator: "transformerType",
                            definition: [
                              {
                                type: "boolean",
                              },
                              {
                                type: "schemaReference",
                                tag: {
                                  value: {
                                    description:
                                      "A transformer that resolves to a boolean indicating whether the attribute is hidden.",
                                    canBeTemplate: false,
                                  },
                                },
                                definition: {
                                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  relativePath: "transformerForBuildPlusRuntime",
                                },
                              },
                            ],
                          },
                          editable: {
                            type: "boolean",
                            tag: {
                              value: {
                                description:
                                  "Whether the attribute is editable in UIs upon instance creation.",
                                canBeTemplate: false,
                              },
                            },
                            optional: true,
                          },
                          modifiable: {
                            type: "boolean",
                            tag: {
                              value: {
                                description:
                                  "Whether the attribute is modifiable in UIs after instance creation.",
                                canBeTemplate: false,
                              },
                            },
                            optional: true,
                          },
                          uuid: {
                            type: "object",
                            optional: true,
                            definition: {
                              selector: {
                                type: "enum",
                                optional: true,
                                definition: ["portalSelector", "muiSelector"],
                              },
                            },
                          },
                          objectUuidAttributeLabelPosition: {
                            type: "enum",
                            optional: true,
                            definition: ["left", "stacked", "hidden"],
                          },
                          objectHideDeleteButton: {
                            type: "boolean",
                            optional: true,
                          },
                          objectHideOptionalButton: {
                            type: "boolean",
                            optional: true,
                          },
                          objectWithoutHeader: {
                            type: "boolean",
                            optional: true,
                          },
                          objectAttributesNoIndent: {
                            type: "boolean",
                            optional: true,
                          },
                          objectOrArrayWithoutFrame: {
                            type: "boolean",
                            optional: true,
                          },
                          unfoldSubLevels: {
                            type: "number",
                            optional: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      tag: {
        value: {
          display: {
            unfoldSubLevels: 2,
          },
        },
      },
    },
    testValueObject: { type: "object", definition: { a: { type: "string" } } },
    expectedKeyMap: undefined,
  },
  // JzodSchema: schema reference with simple attribute
  test330: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "jzodElement",
      },
    },
    testValueObject: {
      type: "schemaReference",
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "jzodElement",
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        type: {
          type: "literal",
          definition: "schemaReference",
        },
        definition: {
          type: "object",
          definition: {
            absolutePath: {
              type: "string",
              optional: true,
            },
            relativePath: {
              type: "string",
            },
          },
        },
      },
      tag: {
        optional: true,
        schema: {
          optional: true,
          metaSchema: {
            type: "object",
            optional: true,
            definition: {
              optional: {
                type: "boolean",
                optional: true,
              },
              metaSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
              valueSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
            },
          },
          valueSchema: {
            type: "object",
            optional: true,
            definition: {
              id: {
                type: "number",
                optional: true,
              },
              defaultLabel: {
                type: "string",
                optional: true,
              },
              description: {
                type: "string",
                optional: true,
              },
              editorButton: {
                type: "object",
                optional: true,
                definition: {
                  icon: {
                    type: "string",
                    optional: true,
                  },
                  label: {
                    type: "string",
                    optional: true,
                  },
                  tooltip: {
                    type: "string",
                    optional: true,
                  },
                  transformer: {
                    type: "any",
                    tag: {
                      value: {
                        ifThenElseMMLS: {
                          mmlsReference: {
                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            relativePath: "transformerForBuild",
                          },
                        },
                      },
                    },
                    optional: true,
                  },
                },
              },
              initializeTo: {
                type: "union",
                discriminator: "initializeToType",
                optional: true,
                definition: [
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "value",
                      },
                      value: {
                        type: "any",
                        optional: true,
                      },
                    },
                  },
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "transformer",
                      },
                      transformer: {
                        type: "any",
                        tag: {
                          value: {
                            ifThenElseMMLS: {
                              mmlsReference: {
                                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                relativePath: "transformerForBuild",
                              },
                            },
                          },
                        },
                        optional: true,
                      },
                    },
                  },
                ],
              },
              isBlob: {
                type: "boolean",
                optional: true,
              },
              selectorParams: {
                type: "object",
                optional: true,
                definition: {
                  targetApplicationUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetDeploymentUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetEntityApplicationSection: {
                    type: "enum",
                    optional: true,
                    definition: ["model", "data", "metaModel"],
                  },
                  targetEntity: {
                    type: "uuid",
                  },
                  targetEntityOrderInstancesBy: {
                    type: "string",
                    optional: true,
                  },
                },
              },
              targetEntity: {
                type: "string",
                optional: true,
              },
              targetEntityOrderInstancesBy: {
                type: "string",
                optional: true,
              },
              targetEntityApplicationSection: {
                type: "enum",
                optional: true,
                definition: ["model", "data", "metaModel"],
              },
              editable: {
                type: "boolean",
                optional: true,
              },
              canBeTemplate: {
                type: "boolean",
                optional: true,
              },
              isTemplate: {
                type: "boolean",
                optional: true,
              },
              ifThenElseMMLS: {
                type: "object",
                optional: true,
                definition: {
                  parentUuid: {
                    type: "union",
                    optional: true,
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "object",
                        definition: {
                          path: {
                            type: "union",
                            definition: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                definition: {
                                  defaultValuePath: {
                                    type: "string",
                                  },
                                  typeCheckPath: {
                                    type: "string",
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                  mmlsReference: {
                    type: "object",
                    optional: true,
                    definition: {
                      absolutePath: {
                        type: "string",
                        optional: true,
                      },
                      relativePath: {
                        type: "string",
                      },
                    },
                  },
                },
              },
              display: {
                type: "object",
                optional: true,
                definition: {
                  displayedAttributeValueWhenFolded: {
                    type: "string",
                    optional: true,
                  },
                  ...(extradisplayAttributes as any),
                  unfoldSubLevels: {
                    type: "number",
                    optional: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  //     // JzodSchema: schema reference for object with extend clause
  test340: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "jzodElement",
      },
    },
    testValueObject: {
      type: "schemaReference",
      context: {
        a: {
          type: "string",
        },
      },
      definition: {
        relativePath: "a",
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        type: {
          type: "literal",
          definition: "schemaReference",
        },
        context: {
          type: "object",
          optional: true,
          definition: {
            a: {
              type: "object",
              definition: {
                type: {
                  type: "literal",
                  definition: "string",
                },
              },
              tag: {
                optional: true,
                schema: {
                  optional: true,
                  metaSchema: {
                    type: "object",
                    optional: true,
                    definition: {
                      optional: {
                        type: "boolean",
                        optional: true,
                      },
                      metaSchema: {
                        type: "schemaReference",
                        optional: true,
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                      valueSchema: {
                        type: "schemaReference",
                        optional: true,
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  valueSchema: {
                    type: "object",
                    optional: true,
                    definition: {
                      id: {
                        type: "number",
                        optional: true,
                      },
                      defaultLabel: {
                        type: "string",
                        optional: true,
                      },
                      description: {
                        type: "string",
                        optional: true,
                      },
                      editorButton: {
                        type: "object",
                        optional: true,
                        definition: {
                          icon: {
                            type: "string",
                            optional: true,
                          },
                          label: {
                            type: "string",
                            optional: true,
                          },
                          tooltip: {
                            type: "string",
                            optional: true,
                          },
                          transformer: {
                            type: "any",
                            tag: {
                              value: {
                                ifThenElseMMLS: {
                                  mmlsReference: {
                                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                    relativePath: "transformerForBuild",
                                  },
                                },
                              },
                            },
                            optional: true,
                          },
                        },
                      },
                      initializeTo: {
                        type: "union",
                        discriminator: "initializeToType",
                        optional: true,
                        definition: [
                          {
                            type: "object",
                            optional: true,
                            definition: {
                              initializeToType: {
                                type: "literal",
                                definition: "value",
                              },
                              value: {
                                type: "any",
                                optional: true,
                              },
                            },
                          },
                          {
                            type: "object",
                            optional: true,
                            definition: {
                              initializeToType: {
                                type: "literal",
                                definition: "transformer",
                              },
                              transformer: {
                                type: "any",
                                tag: {
                                  value: {
                                    ifThenElseMMLS: {
                                      mmlsReference: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath: "transformerForBuild",
                                      },
                                    },
                                  },
                                },
                                optional: true,
                              },
                            },
                          },
                        ],
                      },
                      isBlob: {
                        type: "boolean",
                        optional: true,
                      },
                      selectorParams: {
                        type: "object",
                        optional: true,
                        definition: {
                          targetApplicationUuid: {
                            type: "uuid",
                            optional: true,
                          },
                          targetDeploymentUuid: {
                            type: "uuid",
                            optional: true,
                          },
                          targetEntityApplicationSection: {
                            type: "enum",
                            optional: true,
                            definition: ["model", "data", "metaModel"],
                          },
                          targetEntity: {
                            type: "uuid",
                          },
                          targetEntityOrderInstancesBy: {
                            type: "string",
                            optional: true,
                          },
                        },
                      },
                      targetEntity: {
                        type: "string",
                        optional: true,
                      },
                      targetEntityOrderInstancesBy: {
                        type: "string",
                        optional: true,
                      },
                      targetEntityApplicationSection: {
                        type: "enum",
                        optional: true,
                        definition: ["model", "data", "metaModel"],
                      },
                      editable: {
                        type: "boolean",
                        optional: true,
                      },
                      canBeTemplate: {
                        type: "boolean",
                        optional: true,
                      },
                      isTemplate: {
                        type: "boolean",
                        optional: true,
                      },
                      ifThenElseMMLS: {
                        type: "object",
                        optional: true,
                        definition: {
                          parentUuid: {
                            type: "union",
                            optional: true,
                            definition: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                definition: {
                                  path: {
                                    type: "union",
                                    definition: [
                                      {
                                        type: "string",
                                      },
                                      {
                                        type: "object",
                                        definition: {
                                          defaultValuePath: {
                                            type: "string",
                                          },
                                          typeCheckPath: {
                                            type: "string",
                                          },
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                          mmlsReference: {
                            type: "object",
                            optional: true,
                            definition: {
                              absolutePath: {
                                type: "string",
                                optional: true,
                              },
                              relativePath: {
                                type: "string",
                              },
                            },
                          },
                        },
                      },
                      display: {
                        type: "object",
                        optional: true,
                        definition: {
                          displayedAttributeValueWhenFolded: {
                            type: "string",
                            optional: true,
                          },
                          ...(extradisplayAttributes as any),
                          unfoldSubLevels: {
                            type: "number",
                            optional: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        definition: {
          type: "object",
          definition: {
            relativePath: {
              type: "string",
            },
          },
        },
      },
      tag: {
        optional: true,
        schema: {
          optional: true,
          metaSchema: {
            type: "object",
            optional: true,
            definition: {
              optional: {
                type: "boolean",
                optional: true,
              },
              metaSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
              valueSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
            },
          },
          valueSchema: {
            type: "object",
            optional: true,
            definition: {
              id: {
                type: "number",
                optional: true,
              },
              defaultLabel: {
                type: "string",
                optional: true,
              },
              description: {
                type: "string",
                optional: true,
              },
              editorButton: {
                type: "object",
                optional: true,
                definition: {
                  icon: {
                    type: "string",
                    optional: true,
                  },
                  label: {
                    type: "string",
                    optional: true,
                  },
                  tooltip: {
                    type: "string",
                    optional: true,
                  },
                  transformer: {
                    type: "any",
                    tag: {
                      value: {
                        ifThenElseMMLS: {
                          mmlsReference: {
                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            relativePath: "transformerForBuild",
                          },
                        },
                      },
                    },
                    optional: true,
                  },
                },
              },
              initializeTo: {
                type: "union",
                discriminator: "initializeToType",
                optional: true,
                definition: [
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "value",
                      },
                      value: {
                        type: "any",
                        optional: true,
                      },
                    },
                  },
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "transformer",
                      },
                      transformer: {
                        type: "any",
                        tag: {
                          value: {
                            ifThenElseMMLS: {
                              mmlsReference: {
                                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                relativePath: "transformerForBuild",
                              },
                            },
                          },
                        },
                        optional: true,
                      },
                    },
                  },
                ],
              },
              isBlob: {
                type: "boolean",
                optional: true,
              },
              selectorParams: {
                type: "object",
                optional: true,
                definition: {
                  targetApplicationUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetDeploymentUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetEntityApplicationSection: {
                    type: "enum",
                    optional: true,
                    definition: ["model", "data", "metaModel"],
                  },
                  targetEntity: {
                    type: "uuid",
                  },
                  targetEntityOrderInstancesBy: {
                    type: "string",
                    optional: true,
                  },
                },
              },
              targetEntity: {
                type: "string",
                optional: true,
              },
              targetEntityOrderInstancesBy: {
                type: "string",
                optional: true,
              },
              targetEntityApplicationSection: {
                type: "enum",
                optional: true,
                definition: ["model", "data", "metaModel"],
              },
              editable: {
                type: "boolean",
                optional: true,
              },
              canBeTemplate: {
                type: "boolean",
                optional: true,
              },
              isTemplate: {
                type: "boolean",
                optional: true,
              },
              ifThenElseMMLS: {
                type: "object",
                optional: true,
                definition: {
                  parentUuid: {
                    type: "union",
                    optional: true,
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "object",
                        definition: {
                          path: {
                            type: "union",
                            definition: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                definition: {
                                  defaultValuePath: {
                                    type: "string",
                                  },
                                  typeCheckPath: {
                                    type: "string",
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                  mmlsReference: {
                    type: "object",
                    optional: true,
                    definition: {
                      absolutePath: {
                        type: "string",
                        optional: true,
                      },
                      relativePath: {
                        type: "string",
                      },
                    },
                  },
                },
              },
              display: {
                type: "object",
                optional: true,
                definition: {
                  displayedAttributeValueWhenFolded: {
                    type: "string",
                    optional: true,
                  },
                  ...(extradisplayAttributes as any),
                  unfoldSubLevels: {
                    type: "number",
                    optional: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  // real case, simple
  test350: {
    testSchema: {
      type: "object",
      definition: {
        a: { type: "string", optional: true },
        b: { type: "number" },
        c: { type: "boolean", optional: true },
      },
    },
    testValueObject: {
      b: 42,
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        // a: { type: "string", optional: true },
        b: { type: "number" },
        // c: { type: "boolean", optional: true },
      },
    },
    expectedKeyMap: {
      b: {
        rawSchema: {
          type: "number",
        },
        resolvedSchema: {
          type: "number",
        },
        valuePath: ["b"],
        typePath: ["b"],
      },
      "": {
        rawSchema: {
          type: "object",
          definition: {
            a: {
              type: "string",
              optional: true,
            },
            b: {
              type: "number",
            },
            c: {
              type: "boolean",
              optional: true,
            },
          },
        },
        resolvedSchema: {
          type: "object",
          definition: {
            b: {
              type: "number",
            },
          },
        },
        jzodObjectFlattenedSchema: {
          type: "object",
          definition: {
            a: {
              type: "string",
              optional: true,
            },
            b: {
              type: "number",
            },
            c: {
              type: "boolean",
              optional: true,
            },
          },
        },
        valuePath: [],
        typePath: [],
      },
    },
  },
  //     // real case, JzodReference
  test360: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: castMiroirFundamentalJzodSchema.uuid,
        relativePath: "jzodReference",
      },
    },
    testValueObject: {
      type: "schemaReference",
      definition: {
        eager: true,
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "transformer_orderBy",
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        type: {
          type: "literal",
          definition: "schemaReference",
        },
        definition: {
          type: "object",
          definition: {
            eager: {
              type: "boolean",
              optional: true,
            },
            absolutePath: {
              type: "string",
              optional: true,
            },
            relativePath: {
              type: "string",
            },
          },
        },
      },
      tag: {
        optional: true,
        schema: {
          optional: true,
          metaSchema: {
            type: "object",
            optional: true,
            definition: {
              optional: {
                type: "boolean",
                optional: true,
              },
              metaSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
              valueSchema: {
                type: "schemaReference",
                optional: true,
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
            },
          },
          valueSchema: {
            type: "object",
            optional: true,
            definition: {
              id: {
                type: "number",
                optional: true,
              },
              defaultLabel: {
                type: "string",
                optional: true,
              },
              description: {
                type: "string",
                optional: true,
              },
              editorButton: {
                type: "object",
                optional: true,
                definition: {
                  icon: {
                    type: "string",
                    optional: true,
                  },
                  label: {
                    type: "string",
                    optional: true,
                  },
                  tooltip: {
                    type: "string",
                    optional: true,
                  },
                  transformer: {
                    type: "any",
                    tag: {
                      value: {
                        ifThenElseMMLS: {
                          mmlsReference: {
                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            relativePath: "transformerForBuild",
                          },
                        },
                      },
                    },
                    optional: true,
                  },
                },
              },
              initializeTo: {
                type: "union",
                discriminator: "initializeToType",
                optional: true,
                definition: [
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "value",
                      },
                      value: {
                        type: "any",
                        optional: true,
                      },
                    },
                  },
                  {
                    type: "object",
                    optional: true,
                    definition: {
                      initializeToType: {
                        type: "literal",
                        definition: "transformer",
                      },
                      transformer: {
                        type: "any",
                        tag: {
                          value: {
                            ifThenElseMMLS: {
                              mmlsReference: {
                                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                relativePath: "transformerForBuild",
                              },
                            },
                          },
                        },
                        optional: true,
                      },
                    },
                  },
                ],
              },
              isBlob: {
                type: "boolean",
                optional: true,
              },
              selectorParams: {
                type: "object",
                optional: true,
                definition: {
                  targetApplicationUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetDeploymentUuid: {
                    type: "uuid",
                    optional: true,
                  },
                  targetEntityApplicationSection: {
                    type: "enum",
                    optional: true,
                    definition: ["model", "data", "metaModel"],
                  },
                  targetEntity: {
                    type: "uuid",
                  },
                  targetEntityOrderInstancesBy: {
                    type: "string",
                    optional: true,
                  },
                },
              },
              targetEntity: {
                type: "string",
                optional: true,
              },
              targetEntityOrderInstancesBy: {
                type: "string",
                optional: true,
              },
              targetEntityApplicationSection: {
                type: "enum",
                optional: true,
                definition: ["model", "data", "metaModel"],
              },
              editable: {
                type: "boolean",
                optional: true,
              },
              canBeTemplate: {
                type: "boolean",
                optional: true,
              },
              isTemplate: {
                type: "boolean",
                optional: true,
              },
              ifThenElseMMLS: {
                type: "object",
                optional: true,
                definition: {
                  parentUuid: {
                    type: "union",
                    optional: true,
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "object",
                        definition: {
                          path: {
                            type: "union",
                            definition: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                definition: {
                                  defaultValuePath: {
                                    type: "string",
                                  },
                                  typeCheckPath: {
                                    type: "string",
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                  mmlsReference: {
                    type: "object",
                    optional: true,
                    definition: {
                      absolutePath: {
                        type: "string",
                        optional: true,
                      },
                      relativePath: {
                        type: "string",
                      },
                    },
                  },
                },
              },
              display: {
                type: "object",
                optional: true,
                definition: {
                  displayedAttributeValueWhenFolded: {
                    type: "string",
                    optional: true,
                  },
                  ...(extradisplayAttributes as any),
                  unfoldSubLevels: {
                    type: "number",
                    optional: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  //     // ##########################################################################################
  //     // ####################################### ANY #############################################
  //     // ##########################################################################################
  test400: {
    testSchema: {
      type: "any",
    },
    testValueObject: "test",
    expectedResolvedSchema: {
      type: "string",
    },
    expectedKeyMap: {
      "": {
        rawSchema: {
          type: "any",
        },
        resolvedSchema: {
          type: "string",
        },
        valuePath: [],
        typePath: [],
      },
    },
  },
  test410: {
    testSchema: {
      type: "any",
    },
    testValueObject: [42, "test", { a: { b: 42n, c: true }, d: [1, 2, 3] }],
    expectedResolvedSchema: {
      type: "tuple",
      definition: [
        { type: "number" },
        { type: "string" },
        {
          type: "object",
          definition: {
            a: {
              type: "object",
              definition: {
                b: { type: "bigint" },
                c: { type: "boolean" },
              },
            },
            d: {
              type: "tuple",
              definition: [{ type: "number" }, { type: "number" }, { type: "number" }],
            },
          },
        },
      ],
    },
    expectedKeyMap: {
      "": {
        rawSchema: {
          type: "any",
        },
        resolvedSchema: {
          type: "tuple",
          definition: [
            {
              type: "number",
            },
            {
              type: "string",
            },
            {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    b: {
                      type: "bigint",
                    },
                    c: {
                      type: "boolean",
                    },
                  },
                },
                d: {
                  type: "tuple",
                  definition: [
                    {
                      type: "number",
                    },
                    {
                      type: "number",
                    },
                    {
                      type: "number",
                    },
                  ],
                },
              },
            },
          ],
        },
        valuePath: [],
        typePath: [],
      },
    },
  },
  // ##########################################################################################
  // ################################# TRANSFORMERS ###########################################
  // ##########################################################################################
  // Transformers
  // returnValue
  test600: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: castMiroirFundamentalJzodSchema.uuid,
        relativePath: "transformerForBuildPlusRuntime",
      },
    },
    testValueObject: {
      transformerType: "returnValue",
      interpolation: "build",
      value: "test",
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        transformerType: {
          type: "literal",
          definition: "returnValue",
        },
        interpolation: {
          type: "enum",
          optional: true,
          tag: {
            value: {
              id: 1,
              defaultLabel: "Interpolation",
              editable: true,
              initializeTo: {
                initializeToType: "value",
                value: "build",
              },
            },
          },
          definition: ["build", "runtime"],
        },
        value: {
          type: "string",
        },
      },
      tag: {
        value: {
          editable: true,
          editorButton: {
            label: "Apply Transformer to a List",
            transformer: {
              transformerType: "createObject",
              definition: {
                transformerType: "mapList",
                elementTransformer: {
                  transformerType: "getFromContext",
                  referenceName: "originTransformer",
                },
              },
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  // pickFromList
  test610: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: castMiroirFundamentalJzodSchema.uuid,
        relativePath: "transformerForBuildPlusRuntime",
      },
    },
    testValueObject: {
      transformerType: "pickFromList",
      interpolation: "runtime",
      applyTo: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referenceName: "menuList",
      },
      index: 0,
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        transformerType: {
          type: "literal",
          definition: "pickFromList",
        },
        interpolation: {
          type: "enum",
          optional: true,
          tag: {
            value: {
              id: 1,
              defaultLabel: "Interpolation",
              editable: true,
              initializeTo: {
                initializeToType: "value",
                value: "build",
              },
            },
          },
          definition: ["build", "runtime"],
        },
        applyTo: {
          type: "object",
          definition: {
            transformerType: {
              type: "literal",
              definition: "getFromContext",
            },
            interpolation: {
              type: "enum",
              optional: true,
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Interpolation",
                  editable: true,
                  initializeTo: {
                    initializeToType: "value",
                    value: "build",
                  },
                },
              },
              definition: ["build", "runtime"],
            },
            referenceName: {
              optional: true,
              type: "string",
            },
          },
          tag: {
            value: {
              editable: true,
              editorButton: {
                label: "Apply Transformer to a List",
                transformer: {
                  transformerType: "createObject",
                  definition: {
                    transformerType: "mapList",
                    elementTransformer: {
                      transformerType: "getFromContext",
                      referenceName: "originTransformer",
                    },
                  },
                },
              },
            },
          },
        },
        index: {
          type: "number",
        },
      },
      tag: {
        value: {
          editable: true,
          editorButton: {
            label: "Apply Transformer to a List",
            transformer: {
              transformerType: "createObject",
              definition: {
                transformerType: "mapList",
                elementTransformer: {
                  transformerType: "getFromContext",
                  referenceName: "originTransformer",
                },
              },
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  // runtime createObject with inner build transformer
  test620: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: castMiroirFundamentalJzodSchema.uuid,
        relativePath: "transformerForBuildPlusRuntime",
      },
    },
    testValueObject: {
      transformerType: "createObject",
      interpolation: "runtime",
      definition: {
        reportUuid: {
          transformerType: "getFromParameters",
          interpolation: "build",
          referenceName: "createEntity_newEntityListReportUuid",
        },
        label: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition: "List of {{newEntityName}}s",
        },
        section: "data",
        selfApplication: {
          transformerType: "getFromParameters",
          interpolation: "build",
          referencePath: ["adminConfigurationDeploymentParis", "uuid"],
        },
        icon: "local_drink",
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        transformerType: {
          type: "literal",
          definition: "createObject",
        },
        interpolation: {
          type: "enum",
          optional: true,
          tag: {
            value: {
              id: 1,
              defaultLabel: "Interpolation",
              editable: true,
              initializeTo: {
                initializeToType: "value",
                value: "build",
              },
            },
          },
          definition: ["build", "runtime"],
        },
        definition: {
          type: "object",
          definition: {
            reportUuid: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "getFromParameters",
                },
                interpolation: {
                  type: "enum",
                  optional: true,
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Interpolation",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: "build",
                      },
                    },
                  },
                  definition: ["build", "runtime"],
                },
                referenceName: {
                  optional: true,
                  type: "string",
                },
              },
              tag: {
                value: {
                  editable: true,
                  editorButton: {
                    label: "Apply Transformer to a List",
                    transformer: {
                      transformerType: "createObject",
                      definition: {
                        transformerType: "mapList",
                        elementTransformer: {
                          transformerType: "getFromContext",
                          referenceName: "originTransformer",
                        },
                      },
                    },
                  },
                },
              },
            },
            label: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "mustacheStringTemplate",
                },
                interpolation: {
                  type: "enum",
                  optional: true,
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Interpolation",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: "build",
                      },
                    },
                  },
                  definition: ["build", "runtime"],
                },
                definition: {
                  type: "string",
                },
              },
              tag: {
                value: {
                  editable: true,
                  editorButton: {
                    label: "Apply Transformer to a List",
                    transformer: {
                      transformerType: "createObject",
                      definition: {
                        transformerType: "mapList",
                        elementTransformer: {
                          transformerType: "getFromContext",
                          referenceName: "originTransformer",
                        },
                      },
                    },
                  },
                },
              },
            },
            section: {
              type: "string",
            },
            selfApplication: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "getFromParameters",
                },
                interpolation: {
                  type: "enum",
                  optional: true,
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Interpolation",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: "build",
                      },
                    },
                  },
                  definition: ["build", "runtime"],
                },
                referencePath: {
                  optional: true,
                  type: "tuple",
                  definition: [
                    {
                      type: "string",
                    },
                    {
                      type: "string",
                    },
                  ],
                },
              },
              tag: {
                value: {
                  editable: true,
                  editorButton: {
                    label: "Apply Transformer to a List",
                    transformer: {
                      transformerType: "createObject",
                      definition: {
                        transformerType: "mapList",
                        elementTransformer: {
                          transformerType: "getFromContext",
                          referenceName: "originTransformer",
                        },
                      },
                    },
                  },
                },
              },
            },
            icon: {
              type: "string",
            },
          },
        },
      },
      tag: {
        value: {
          editable: true,
          editorButton: {
            label: "Apply Transformer to a List",
            transformer: {
              transformerType: "createObject",
              definition: {
                transformerType: "mapList",
                elementTransformer: {
                  transformerType: "getFromContext",
                  referenceName: "originTransformer",
                },
              },
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  // mapList Transformer
  test630: {
    testSchema: {
      type: "object",
      definition: {
        uuid: {
          type: "uuid",
          tag: {
            value: {
              id: 1,
              defaultLabel: "Uuid",
              editable: false,
            },
          },
        },
        parentName: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 2,
              defaultLabel: "Entity Name",
              editable: false,
            },
          },
        },
        parentUuid: {
          type: "uuid",
          tag: {
            value: {
              id: 3,
              defaultLabel: "Entity Uuid",
              editable: false,
            },
          },
        },
        parentDefinitionVersionUuid: {
          type: "uuid",
          optional: true,
          tag: {
            value: {
              id: 4,
              defaultLabel: "Entity Definition Version Uuid",
              editable: false,
            },
          },
        },
        name: {
          type: "string",
          tag: {
            value: {
              id: 5,
              defaultLabel: "Name",
              editable: true,
            },
          },
        },
        defaultLabel: {
          type: "string",
          tag: {
            value: {
              id: 6,
              defaultLabel: "Default Label",
              editable: true,
            },
          },
        },
        description: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 7,
              defaultLabel: "Description",
              editable: true,
            },
          },
        },
        transformerInterface: {
          type: "object",
          definition: {
            transformerParameterSchema: {
              type: "object",
              definition: {
                transformerType: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "jzodLiteral",
                  },
                },
                transformerDefinition: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "jzodObject",
                  },
                },
              },
            },
            transformerResultSchema: {
              type: "schemaReference",
              optional: true,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
            },
          },
        },
        transformerImplementation: {
          type: "union",
          discriminator: "transformerImplementationType",
          definition: [
            {
              type: "object",
              definition: {
                transformerImplementationType: {
                  type: "literal",
                  definition: "libraryImplementation",
                },
                inMemoryImplementationFunctionName: {
                  type: "string",
                },
                sqlImplementationFunctionName: {
                  type: "string",
                  optional: true,
                },
              },
            },
            {
              type: "object",
              definition: {
                transformerImplementationType: {
                  type: "literal",
                  definition: "transformer",
                },
                definition: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "transformerForBuildPlusRuntime",
                  },
                },
              },
            },
          ],
        },
      },
    },
    testValueObject: {
      uuid: "3ec73049-5e54-40aa-bc86-4c4906d00baa",
      name: "mapList",
      defaultLabel: "mapList",
      description:
        "Transform a list into another list, running the given transformer on each item of the list",
      parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
      parentDefinitionVersionUuid: "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
      parentName: "TransformerDefinition",
      transformerInterface: {
        transformerParameterSchema: {
          transformerType: {
            type: "literal",
            definition: "mapList",
          },
          transformerDefinition: {
            type: "object",
            extend: [
              {
                type: "schemaReference",
                definition: {
                  eager: true,
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "transformer_orderBy",
                },
              },
            ],
            definition: {
              applyTo: {
                type: "array",
                definition: {
                  type: "any",
                },
              },
              referenceToOuterObject: {
                type: "string",
              },
              elementTransformer: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath:
                    "transformer_inner_elementTransformer_transformerForBuildPlusRuntime",
                },
              },
            },
          },
        },
        transformerResultSchema: {
          type: "array",
          definition: {
            type: "any",
          },
        },
      },
      transformerImplementation: {
        transformerImplementationType: "libraryImplementation",
        inMemoryImplementationFunctionName: "transformerForBuild_list_listMapperToList_apply",
        sqlImplementationFunctionName: "sqlStringForMapperListToListTransformer",
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        uuid: {
          type: "uuid",
          tag: {
            value: {
              id: 1,
              defaultLabel: "Uuid",
              editable: false,
            },
          },
        },
        name: {
          type: "string",
          tag: {
            value: {
              id: 5,
              defaultLabel: "Name",
              editable: true,
            },
          },
        },
        defaultLabel: {
          type: "string",
          tag: {
            value: {
              id: 6,
              defaultLabel: "Default Label",
              editable: true,
            },
          },
        },
        description: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 7,
              defaultLabel: "Description",
              editable: true,
            },
          },
        },
        parentUuid: {
          type: "uuid",
          tag: {
            value: {
              id: 3,
              defaultLabel: "Entity Uuid",
              editable: false,
            },
          },
        },
        parentDefinitionVersionUuid: {
          type: "uuid",
          optional: true,
          tag: {
            value: {
              id: 4,
              defaultLabel: "Entity Definition Version Uuid",
              editable: false,
            },
          },
        },
        parentName: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 2,
              defaultLabel: "Entity Name",
              editable: false,
            },
          },
        },
        transformerInterface: {
          type: "object",
          definition: {
            transformerParameterSchema: {
              type: "object",
              definition: {
                transformerType: {
                  type: "object",
                  definition: {
                    type: {
                      type: "literal",
                      definition: "literal",
                    },
                    definition: {
                      type: "string",
                    },
                  },
                  tag: {
                    optional: true,
                    schema: {
                      optional: true,
                      metaSchema: {
                        type: "object",
                        optional: true,
                        definition: {
                          optional: {
                            type: "boolean",
                            optional: true,
                          },
                          metaSchema: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                          valueSchema: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                        },
                      },
                      valueSchema: {
                        type: "object",
                        optional: true,
                        definition: {
                          id: {
                            type: "number",
                            optional: true,
                          },
                          defaultLabel: {
                            type: "string",
                            optional: true,
                          },
                          description: {
                            type: "string",
                            optional: true,
                          },
                          editorButton: {
                            type: "object",
                            optional: true,
                            definition: {
                              icon: {
                                type: "string",
                                optional: true,
                              },
                              label: {
                                type: "string",
                                optional: true,
                              },
                              tooltip: {
                                type: "string",
                                optional: true,
                              },
                              transformer: {
                                type: "any",
                                tag: {
                                  value: {
                                    ifThenElseMMLS: {
                                      mmlsReference: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath: "transformerForBuild",
                                      },
                                    },
                                  },
                                },
                                optional: true,
                              },
                            },
                          },
                          initializeTo: {
                            type: "union",
                            discriminator: "initializeToType",
                            optional: true,
                            definition: [
                              {
                                type: "object",
                                optional: true,
                                definition: {
                                  initializeToType: {
                                    type: "literal",
                                    definition: "value",
                                  },
                                  value: {
                                    type: "any",
                                    optional: true,
                                  },
                                },
                              },
                              {
                                type: "object",
                                optional: true,
                                definition: {
                                  initializeToType: {
                                    type: "literal",
                                    definition: "transformer",
                                  },
                                  transformer: {
                                    type: "any",
                                    tag: {
                                      value: {
                                        ifThenElseMMLS: {
                                          mmlsReference: {
                                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                            relativePath: "transformerForBuild",
                                          },
                                        },
                                      },
                                    },
                                    optional: true,
                                  },
                                },
                              },
                            ],
                          },
                          isBlob: {
                            type: "boolean",
                            optional: true,
                          },
                          selectorParams: {
                            type: "object",
                            optional: true,
                            definition: {
                              targetApplicationUuid: {
                                type: "uuid",
                                optional: true,
                              },
                              targetDeploymentUuid: {
                                type: "uuid",
                                optional: true,
                              },
                              targetEntityApplicationSection: {
                                type: "enum",
                                optional: true,
                                definition: ["model", "data", "metaModel"],
                              },
                              targetEntity: {
                                type: "uuid",
                              },
                              targetEntityOrderInstancesBy: {
                                type: "string",
                                optional: true,
                              },
                            },
                          },
                          targetEntity: {
                            type: "string",
                            optional: true,
                          },
                          targetEntityOrderInstancesBy: {
                            type: "string",
                            optional: true,
                          },
                          targetEntityApplicationSection: {
                            type: "enum",
                            optional: true,
                            definition: ["model", "data", "metaModel"],
                          },
                          editable: {
                            type: "boolean",
                            optional: true,
                          },
                          canBeTemplate: {
                            type: "boolean",
                            optional: true,
                          },
                          isTemplate: {
                            type: "boolean",
                            optional: true,
                          },
                          ifThenElseMMLS: {
                            type: "object",
                            optional: true,
                            definition: {
                              parentUuid: {
                                type: "union",
                                optional: true,
                                definition: [
                                  {
                                    type: "string",
                                  },
                                  {
                                    type: "object",
                                    definition: {
                                      path: {
                                        type: "union",
                                        definition: [
                                          {
                                            type: "string",
                                          },
                                          {
                                            type: "object",
                                            definition: {
                                              defaultValuePath: {
                                                type: "string",
                                              },
                                              typeCheckPath: {
                                                type: "string",
                                              },
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                ],
                              },
                              mmlsReference: {
                                type: "object",
                                optional: true,
                                definition: {
                                  absolutePath: {
                                    type: "string",
                                    optional: true,
                                  },
                                  relativePath: {
                                    type: "string",
                                  },
                                },
                              },
                            },
                          },
                          display: {
                            type: "object",
                            optional: true,
                            definition: {
                              displayedAttributeValueWhenFolded: {
                                type: "string",
                                optional: true,
                              },
                              ...(extradisplayAttributes as any),
                              unfoldSubLevels: {
                                type: "number",
                                optional: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                transformerDefinition: {
                  type: "object",
                  definition: {
                    type: {
                      type: "literal",
                      definition: "object",
                    },
                    extend: {
                      type: "array",
                      discriminator: "type", // TODO: NO discriminator in arrays
                      optional: true,
                      definition: {
                        type: "object",
                        definition: {
                          type: {
                            type: "literal",
                            definition: "schemaReference",
                          },
                          definition: {
                            type: "object",
                            definition: {
                              eager: {
                                type: "boolean",
                                optional: true,
                              },
                              absolutePath: {
                                type: "string",
                                optional: true,
                              },
                              relativePath: {
                                type: "string",
                              },
                            },
                          },
                        },
                        tag: {
                          optional: true,
                          schema: {
                            optional: true,
                            metaSchema: {
                              type: "object",
                              optional: true,
                              definition: {
                                optional: {
                                  type: "boolean",
                                  optional: true,
                                },
                                metaSchema: {
                                  type: "schemaReference",
                                  optional: true,
                                  definition: {
                                    absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    relativePath: "jzodElement",
                                  },
                                },
                                valueSchema: {
                                  type: "schemaReference",
                                  optional: true,
                                  definition: {
                                    absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    relativePath: "jzodElement",
                                  },
                                },
                              },
                            },
                            valueSchema: {
                              type: "object",
                              optional: true,
                              definition: {
                                id: {
                                  type: "number",
                                  optional: true,
                                },
                                defaultLabel: {
                                  type: "string",
                                  optional: true,
                                },
                                description: {
                                  type: "string",
                                  optional: true,
                                },
                                editorButton: {
                                  type: "object",
                                  optional: true,
                                  definition: {
                                    icon: {
                                      type: "string",
                                      optional: true,
                                    },
                                    label: {
                                      type: "string",
                                      optional: true,
                                    },
                                    tooltip: {
                                      type: "string",
                                      optional: true,
                                    },
                                    transformer: {
                                      type: "any",
                                      tag: {
                                        value: {
                                          ifThenElseMMLS: {
                                            mmlsReference: {
                                              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                              relativePath: "transformerForBuild",
                                            },
                                          },
                                        },
                                      },
                                      optional: true,
                                    },
                                  },
                                },
                                initializeTo: {
                                  type: "union",
                                  discriminator: "initializeToType",
                                  optional: true,
                                  definition: [
                                    {
                                      type: "object",
                                      optional: true,
                                      definition: {
                                        initializeToType: {
                                          type: "literal",
                                          definition: "value",
                                        },
                                        value: {
                                          type: "any",
                                          optional: true,
                                        },
                                      },
                                    },
                                    {
                                      type: "object",
                                      optional: true,
                                      definition: {
                                        initializeToType: {
                                          type: "literal",
                                          definition: "transformer",
                                        },
                                        transformer: {
                                          type: "any",
                                          tag: {
                                            value: {
                                              ifThenElseMMLS: {
                                                mmlsReference: {
                                                  absolutePath:
                                                    "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                                  relativePath: "transformerForBuild",
                                                },
                                              },
                                            },
                                          },
                                          optional: true,
                                        },
                                      },
                                    },
                                  ],
                                },
                                isBlob: {
                                  type: "boolean",
                                  optional: true,
                                },
                                selectorParams: {
                                  type: "object",
                                  optional: true,
                                  definition: {
                                    targetApplicationUuid: {
                                      type: "uuid",
                                      optional: true,
                                    },
                                    targetDeploymentUuid: {
                                      type: "uuid",
                                      optional: true,
                                    },
                                    targetEntityApplicationSection: {
                                      type: "enum",
                                      optional: true,
                                      definition: ["model", "data", "metaModel"],
                                    },
                                    targetEntity: {
                                      type: "uuid",
                                    },
                                    targetEntityOrderInstancesBy: {
                                      type: "string",
                                      optional: true,
                                    },
                                  },
                                },
                                targetEntity: {
                                  type: "string",
                                  optional: true,
                                },
                                targetEntityOrderInstancesBy: {
                                  type: "string",
                                  optional: true,
                                },
                                targetEntityApplicationSection: {
                                  type: "enum",
                                  optional: true,
                                  definition: ["model", "data", "metaModel"],
                                },
                                editable: {
                                  type: "boolean",
                                  optional: true,
                                },
                                canBeTemplate: {
                                  type: "boolean",
                                  optional: true,
                                },
                                isTemplate: {
                                  type: "boolean",
                                  optional: true,
                                },
                                ifThenElseMMLS: {
                                  type: "object",
                                  optional: true,
                                  definition: {
                                    parentUuid: {
                                      type: "union",
                                      optional: true,
                                      definition: [
                                        {
                                          type: "string",
                                        },
                                        {
                                          type: "object",
                                          definition: {
                                            path: {
                                              type: "union",
                                              definition: [
                                                {
                                                  type: "string",
                                                },
                                                {
                                                  type: "object",
                                                  definition: {
                                                    defaultValuePath: {
                                                      type: "string",
                                                    },
                                                    typeCheckPath: {
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                              ],
                                            },
                                          },
                                        },
                                      ],
                                    },
                                    mmlsReference: {
                                      type: "object",
                                      optional: true,
                                      definition: {
                                        absolutePath: {
                                          type: "string",
                                          optional: true,
                                        },
                                        relativePath: {
                                          type: "string",
                                        },
                                      },
                                    },
                                  },
                                },
                                display: {
                                  type: "object",
                                  optional: true,
                                  definition: {
                                    displayedAttributeValueWhenFolded: {
                                      type: "string",
                                      optional: true,
                                    },
                                    ...(extradisplayAttributes as any),
                                    unfoldSubLevels: {
                                      type: "number",
                                      optional: true,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    } as any,
                    definition: {
                      type: "object",
                      definition: {
                        applyTo: {
                          type: "object",
                          definition: {
                            type: {
                              type: "literal",
                              definition: "array",
                            },
                            definition: {
                              type: "object",
                              definition: {
                                type: {
                                  type: "enum",
                                  tag: {
                                    value: {
                                      description:
                                        "The type of a plain attribute (not object, not array) with no validation.",
                                      editable: true,
                                      initializeTo: {
                                        initializeToType: "value",
                                        value: "any",
                                      },
                                    },
                                  },
                                  definition: [
                                    "any",
                                    "bigint",
                                    "boolean",
                                    "never",
                                    "null",
                                    "uuid",
                                    "undefined",
                                    "unknown",
                                    "void",
                                  ],
                                },
                              },
                              tag: {
                                value: {
                                  description:
                                    "A plain attribute (not object, not array) with no validation.",
                                  editable: true,
                                  initializeTo: {
                                    initializeToType: "value",
                                    value: null,
                                  },
                                },
                              },
                            },
                          },
                          tag: {
                            optional: true,
                            schema: {
                              optional: true,
                              metaSchema: {
                                type: "object",
                                optional: true,
                                definition: {
                                  optional: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  metaSchema: {
                                    type: "schemaReference",
                                    optional: true,
                                    definition: {
                                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                      relativePath: "jzodElement",
                                    },
                                  },
                                  valueSchema: {
                                    type: "schemaReference",
                                    optional: true,
                                    definition: {
                                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                      relativePath: "jzodElement",
                                    },
                                  },
                                },
                              },
                              valueSchema: {
                                type: "object",
                                optional: true,
                                definition: {
                                  id: {
                                    type: "number",
                                    optional: true,
                                  },
                                  defaultLabel: {
                                    type: "string",
                                    optional: true,
                                  },
                                  description: {
                                    type: "string",
                                    optional: true,
                                  },
                                  editorButton: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      icon: {
                                        type: "string",
                                        optional: true,
                                      },
                                      label: {
                                        type: "string",
                                        optional: true,
                                      },
                                      tooltip: {
                                        type: "string",
                                        optional: true,
                                      },
                                      transformer: {
                                        type: "any",
                                        tag: {
                                          value: {
                                            ifThenElseMMLS: {
                                              mmlsReference: {
                                                absolutePath:
                                                  "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                                relativePath: "transformerForBuild",
                                              },
                                            },
                                          },
                                        },
                                        optional: true,
                                      },
                                    },
                                  },
                                  initializeTo: {
                                    type: "union",
                                    discriminator: "initializeToType",
                                    optional: true,
                                    definition: [
                                      {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          initializeToType: {
                                            type: "literal",
                                            definition: "value",
                                          },
                                          value: {
                                            type: "any",
                                            optional: true,
                                          },
                                        },
                                      },
                                      {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          initializeToType: {
                                            type: "literal",
                                            definition: "transformer",
                                          },
                                          transformer: {
                                            type: "any",
                                            tag: {
                                              value: {
                                                ifThenElseMMLS: {
                                                  mmlsReference: {
                                                    absolutePath:
                                                      "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                                    relativePath: "transformerForBuild",
                                                  },
                                                },
                                              },
                                            },
                                            optional: true,
                                          },
                                        },
                                      },
                                    ],
                                  },
                                  isBlob: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  selectorParams: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      targetApplicationUuid: {
                                        type: "uuid",
                                        optional: true,
                                      },
                                      targetDeploymentUuid: {
                                        type: "uuid",
                                        optional: true,
                                      },
                                      targetEntityApplicationSection: {
                                        type: "enum",
                                        optional: true,
                                        definition: ["model", "data", "metaModel"],
                                      },
                                      targetEntity: {
                                        type: "uuid",
                                      },
                                      targetEntityOrderInstancesBy: {
                                        type: "string",
                                        optional: true,
                                      },
                                    },
                                  },
                                  targetEntity: {
                                    type: "string",
                                    optional: true,
                                  },
                                  targetEntityOrderInstancesBy: {
                                    type: "string",
                                    optional: true,
                                  },
                                  targetEntityApplicationSection: {
                                    type: "enum",
                                    optional: true,
                                    definition: ["model", "data", "metaModel"],
                                  },
                                  editable: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  canBeTemplate: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  isTemplate: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  ifThenElseMMLS: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      parentUuid: {
                                        type: "union",
                                        optional: true,
                                        definition: [
                                          {
                                            type: "string",
                                          },
                                          {
                                            type: "object",
                                            definition: {
                                              path: {
                                                type: "union",
                                                definition: [
                                                  {
                                                    type: "string",
                                                  },
                                                  {
                                                    type: "object",
                                                    definition: {
                                                      defaultValuePath: {
                                                        type: "string",
                                                      },
                                                      typeCheckPath: {
                                                        type: "string",
                                                      },
                                                    },
                                                  },
                                                ],
                                              },
                                            },
                                          },
                                        ],
                                      },
                                      mmlsReference: {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          absolutePath: {
                                            type: "string",
                                            optional: true,
                                          },
                                          relativePath: {
                                            type: "string",
                                          },
                                        },
                                      },
                                    },
                                  },
                                  display: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      displayedAttributeValueWhenFolded: {
                                        type: "string",
                                        optional: true,
                                      },
                                      ...(extradisplayAttributes as any),
                                      unfoldSubLevels: {
                                        type: "number",
                                        optional: true,
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        referenceToOuterObject: {
                          type: "object",
                          definition: {
                            type: {
                              type: "literal",
                              definition: "string",
                            },
                          },
                          tag: {
                            optional: true,
                            schema: {
                              optional: true,
                              metaSchema: {
                                type: "object",
                                optional: true,
                                definition: {
                                  optional: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  metaSchema: {
                                    type: "schemaReference",
                                    optional: true,
                                    definition: {
                                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                      relativePath: "jzodElement",
                                    },
                                  },
                                  valueSchema: {
                                    type: "schemaReference",
                                    optional: true,
                                    definition: {
                                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                      relativePath: "jzodElement",
                                    },
                                  },
                                },
                              },
                              valueSchema: {
                                type: "object",
                                optional: true,
                                definition: {
                                  id: {
                                    type: "number",
                                    optional: true,
                                  },
                                  defaultLabel: {
                                    type: "string",
                                    optional: true,
                                  },
                                  description: {
                                    type: "string",
                                    optional: true,
                                  },
                                  editorButton: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      icon: {
                                        type: "string",
                                        optional: true,
                                      },
                                      label: {
                                        type: "string",
                                        optional: true,
                                      },
                                      tooltip: {
                                        type: "string",
                                        optional: true,
                                      },
                                      transformer: {
                                        type: "any",
                                        tag: {
                                          value: {
                                            ifThenElseMMLS: {
                                              mmlsReference: {
                                                absolutePath:
                                                  "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                                relativePath: "transformerForBuild",
                                              },
                                            },
                                          },
                                        },
                                        optional: true,
                                      },
                                    },
                                  },
                                  initializeTo: {
                                    type: "union",
                                    discriminator: "initializeToType",
                                    optional: true,
                                    definition: [
                                      {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          initializeToType: {
                                            type: "literal",
                                            definition: "value",
                                          },
                                          value: {
                                            type: "any",
                                            optional: true,
                                          },
                                        },
                                      },
                                      {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          initializeToType: {
                                            type: "literal",
                                            definition: "transformer",
                                          },
                                          transformer: {
                                            type: "any",
                                            tag: {
                                              value: {
                                                ifThenElseMMLS: {
                                                  mmlsReference: {
                                                    absolutePath:
                                                      "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                                    relativePath: "transformerForBuild",
                                                  },
                                                },
                                              },
                                            },
                                            optional: true,
                                          },
                                        },
                                      },
                                    ],
                                  },
                                  isBlob: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  selectorParams: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      targetApplicationUuid: {
                                        type: "uuid",
                                        optional: true,
                                      },
                                      targetDeploymentUuid: {
                                        type: "uuid",
                                        optional: true,
                                      },
                                      targetEntityApplicationSection: {
                                        type: "enum",
                                        optional: true,
                                        definition: ["model", "data", "metaModel"],
                                      },
                                      targetEntity: {
                                        type: "uuid",
                                      },
                                      targetEntityOrderInstancesBy: {
                                        type: "string",
                                        optional: true,
                                      },
                                    },
                                  },
                                  targetEntity: {
                                    type: "string",
                                    optional: true,
                                  },
                                  targetEntityOrderInstancesBy: {
                                    type: "string",
                                    optional: true,
                                  },
                                  targetEntityApplicationSection: {
                                    type: "enum",
                                    optional: true,
                                    definition: ["model", "data", "metaModel"],
                                  },
                                  editable: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  canBeTemplate: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  isTemplate: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  ifThenElseMMLS: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      parentUuid: {
                                        type: "union",
                                        optional: true,
                                        definition: [
                                          {
                                            type: "string",
                                          },
                                          {
                                            type: "object",
                                            definition: {
                                              path: {
                                                type: "union",
                                                definition: [
                                                  {
                                                    type: "string",
                                                  },
                                                  {
                                                    type: "object",
                                                    definition: {
                                                      defaultValuePath: {
                                                        type: "string",
                                                      },
                                                      typeCheckPath: {
                                                        type: "string",
                                                      },
                                                    },
                                                  },
                                                ],
                                              },
                                            },
                                          },
                                        ],
                                      },
                                      mmlsReference: {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          absolutePath: {
                                            type: "string",
                                            optional: true,
                                          },
                                          relativePath: {
                                            type: "string",
                                          },
                                        },
                                      },
                                    },
                                  },
                                  display: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      displayedAttributeValueWhenFolded: {
                                        type: "string",
                                        optional: true,
                                      },
                                      ...(extradisplayAttributes as any),
                                      unfoldSubLevels: {
                                        type: "number",
                                        optional: true,
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        elementTransformer: {
                          type: "object",
                          definition: {
                            type: {
                              type: "literal",
                              definition: "schemaReference",
                            },
                            definition: {
                              type: "object",
                              definition: {
                                absolutePath: {
                                  type: "string",
                                  optional: true,
                                },
                                relativePath: {
                                  type: "string",
                                },
                              },
                            },
                          },
                          tag: {
                            optional: true,
                            schema: {
                              optional: true,
                              metaSchema: {
                                type: "object",
                                optional: true,
                                definition: {
                                  optional: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  metaSchema: {
                                    type: "schemaReference",
                                    optional: true,
                                    definition: {
                                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                      relativePath: "jzodElement",
                                    },
                                  },
                                  valueSchema: {
                                    type: "schemaReference",
                                    optional: true,
                                    definition: {
                                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                      relativePath: "jzodElement",
                                    },
                                  },
                                },
                              },
                              valueSchema: {
                                type: "object",
                                optional: true,
                                definition: {
                                  id: {
                                    type: "number",
                                    optional: true,
                                  },
                                  defaultLabel: {
                                    type: "string",
                                    optional: true,
                                  },
                                  description: {
                                    type: "string",
                                    optional: true,
                                  },
                                  editorButton: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      icon: {
                                        type: "string",
                                        optional: true,
                                      },
                                      label: {
                                        type: "string",
                                        optional: true,
                                      },
                                      tooltip: {
                                        type: "string",
                                        optional: true,
                                      },
                                      transformer: {
                                        type: "any",
                                        tag: {
                                          value: {
                                            ifThenElseMMLS: {
                                              mmlsReference: {
                                                absolutePath:
                                                  "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                                relativePath: "transformerForBuild",
                                              },
                                            },
                                          },
                                        },
                                        optional: true,
                                      },
                                    },
                                  },
                                  initializeTo: {
                                    type: "union",
                                    discriminator: "initializeToType",
                                    optional: true,
                                    definition: [
                                      {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          initializeToType: {
                                            type: "literal",
                                            definition: "value",
                                          },
                                          value: {
                                            type: "any",
                                            optional: true,
                                          },
                                        },
                                      },
                                      {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          initializeToType: {
                                            type: "literal",
                                            definition: "transformer",
                                          },
                                          transformer: {
                                            type: "any",
                                            tag: {
                                              value: {
                                                ifThenElseMMLS: {
                                                  mmlsReference: {
                                                    absolutePath:
                                                      "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                                    relativePath: "transformerForBuild",
                                                  },
                                                },
                                              },
                                            },
                                            optional: true,
                                          },
                                        },
                                      },
                                    ],
                                  },
                                  isBlob: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  selectorParams: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      targetApplicationUuid: {
                                        type: "uuid",
                                        optional: true,
                                      },
                                      targetDeploymentUuid: {
                                        type: "uuid",
                                        optional: true,
                                      },
                                      targetEntityApplicationSection: {
                                        type: "enum",
                                        optional: true,
                                        definition: ["model", "data", "metaModel"],
                                      },
                                      targetEntity: {
                                        type: "uuid",
                                      },
                                      targetEntityOrderInstancesBy: {
                                        type: "string",
                                        optional: true,
                                      },
                                    },
                                  },
                                  targetEntity: {
                                    type: "string",
                                    optional: true,
                                  },
                                  targetEntityOrderInstancesBy: {
                                    type: "string",
                                    optional: true,
                                  },
                                  targetEntityApplicationSection: {
                                    type: "enum",
                                    optional: true,
                                    definition: ["model", "data", "metaModel"],
                                  },
                                  editable: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  canBeTemplate: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  isTemplate: {
                                    type: "boolean",
                                    optional: true,
                                  },
                                  ifThenElseMMLS: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      parentUuid: {
                                        type: "union",
                                        optional: true,
                                        definition: [
                                          {
                                            type: "string",
                                          },
                                          {
                                            type: "object",
                                            definition: {
                                              path: {
                                                type: "union",
                                                definition: [
                                                  {
                                                    type: "string",
                                                  },
                                                  {
                                                    type: "object",
                                                    definition: {
                                                      defaultValuePath: {
                                                        type: "string",
                                                      },
                                                      typeCheckPath: {
                                                        type: "string",
                                                      },
                                                    },
                                                  },
                                                ],
                                              },
                                            },
                                          },
                                        ],
                                      },
                                      mmlsReference: {
                                        type: "object",
                                        optional: true,
                                        definition: {
                                          absolutePath: {
                                            type: "string",
                                            optional: true,
                                          },
                                          relativePath: {
                                            type: "string",
                                          },
                                        },
                                      },
                                    },
                                  },
                                  display: {
                                    type: "object",
                                    optional: true,
                                    definition: {
                                      displayedAttributeValueWhenFolded: {
                                        type: "string",
                                        optional: true,
                                      },
                                      ...(extradisplayAttributes as any),
                                      unfoldSubLevels: {
                                        type: "number",
                                        optional: true,
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  tag: {
                    value: {
                      display: {
                        unfoldSubLevels: 2,
                      },
                    },
                  },
                },
              },
            },
            transformerResultSchema: {
              type: "object",
              definition: {
                type: {
                  type: "literal",
                  definition: "array",
                },
                definition: {
                  type: "object",
                  definition: {
                    type: {
                      type: "enum",
                      tag: {
                        value: {
                          description:
                            "The type of a plain attribute (not object, not array) with no validation.",
                          editable: true,
                          initializeTo: {
                            initializeToType: "value",
                            value: "any",
                          },
                        },
                      },
                      definition: [
                        "any",
                        "bigint",
                        "boolean",
                        "never",
                        "null",
                        "uuid",
                        "undefined",
                        "unknown",
                        "void",
                      ],
                    },
                  },
                  tag: {
                    value: {
                      description: "A plain attribute (not object, not array) with no validation.",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: null,
                      },
                    },
                  },
                },
              },
              tag: {
                optional: true,
                schema: {
                  optional: true,
                  metaSchema: {
                    type: "object",
                    optional: true,
                    definition: {
                      optional: {
                        type: "boolean",
                        optional: true,
                      },
                      metaSchema: {
                        type: "schemaReference",
                        optional: true,
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                      valueSchema: {
                        type: "schemaReference",
                        optional: true,
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  valueSchema: {
                    type: "object",
                    optional: true,
                    definition: {
                      id: {
                        type: "number",
                        optional: true,
                      },
                      defaultLabel: {
                        type: "string",
                        optional: true,
                      },
                      description: {
                        type: "string",
                        optional: true,
                      },
                      editorButton: {
                        type: "object",
                        optional: true,
                        definition: {
                          icon: {
                            type: "string",
                            optional: true,
                          },
                          label: {
                            type: "string",
                            optional: true,
                          },
                          tooltip: {
                            type: "string",
                            optional: true,
                          },
                          transformer: {
                            type: "any",
                            tag: {
                              value: {
                                ifThenElseMMLS: {
                                  mmlsReference: {
                                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                    relativePath: "transformerForBuild",
                                  },
                                },
                              },
                            },
                            optional: true,
                          },
                        },
                      },
                      initializeTo: {
                        type: "union",
                        discriminator: "initializeToType",
                        optional: true,
                        definition: [
                          {
                            type: "object",
                            optional: true,
                            definition: {
                              initializeToType: {
                                type: "literal",
                                definition: "value",
                              },
                              value: {
                                type: "any",
                                optional: true,
                              },
                            },
                          },
                          {
                            type: "object",
                            optional: true,
                            definition: {
                              initializeToType: {
                                type: "literal",
                                definition: "transformer",
                              },
                              transformer: {
                                type: "any",
                                tag: {
                                  value: {
                                    ifThenElseMMLS: {
                                      mmlsReference: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath: "transformerForBuild",
                                      },
                                    },
                                  },
                                },
                                optional: true,
                              },
                            },
                          },
                        ],
                      },
                      isBlob: {
                        type: "boolean",
                        optional: true,
                      },
                      selectorParams: {
                        type: "object",
                        optional: true,
                        definition: {
                          targetApplicationUuid: {
                            type: "uuid",
                            optional: true,
                          },
                          targetDeploymentUuid: {
                            type: "uuid",
                            optional: true,
                          },
                          targetEntityApplicationSection: {
                            type: "enum",
                            optional: true,
                            definition: ["model", "data", "metaModel"],
                          },
                          targetEntity: {
                            type: "uuid",
                          },
                          targetEntityOrderInstancesBy: {
                            type: "string",
                            optional: true,
                          },
                        },
                      },
                      targetEntity: {
                        type: "string",
                        optional: true,
                      },
                      targetEntityOrderInstancesBy: {
                        type: "string",
                        optional: true,
                      },
                      targetEntityApplicationSection: {
                        type: "enum",
                        optional: true,
                        definition: ["model", "data", "metaModel"],
                      },
                      editable: {
                        type: "boolean",
                        optional: true,
                      },
                      canBeTemplate: {
                        type: "boolean",
                        optional: true,
                      },
                      isTemplate: {
                        type: "boolean",
                        optional: true,
                      },
                      ifThenElseMMLS: {
                        type: "object",
                        optional: true,
                        definition: {
                          parentUuid: {
                            type: "union",
                            optional: true,
                            definition: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                definition: {
                                  path: {
                                    type: "union",
                                    definition: [
                                      {
                                        type: "string",
                                      },
                                      {
                                        type: "object",
                                        definition: {
                                          defaultValuePath: {
                                            type: "string",
                                          },
                                          typeCheckPath: {
                                            type: "string",
                                          },
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                          mmlsReference: {
                            type: "object",
                            optional: true,
                            definition: {
                              absolutePath: {
                                type: "string",
                                optional: true,
                              },
                              relativePath: {
                                type: "string",
                              },
                            },
                          },
                        },
                      },
                      display: {
                        type: "object",
                        optional: true,
                        definition: {
                          displayedAttributeValueWhenFolded: {
                            type: "string",
                            optional: true,
                          },
                          ...(extradisplayAttributes as any),
                          unfoldSubLevels: {
                            type: "number",
                            optional: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        transformerImplementation: {
          type: "object",
          definition: {
            transformerImplementationType: {
              type: "literal",
              definition: "libraryImplementation",
            },
            inMemoryImplementationFunctionName: {
              type: "string",
            },
            sqlImplementationFunctionName: {
              type: "string",
              optional: true,
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  // ##########################################################################################
  // ########################### QUERIES ######################################
  // ##########################################################################################
  test700: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: castMiroirFundamentalJzodSchema.uuid,
        relativePath: "boxedQueryWithExtractorCombinerTransformer",
      },
    },
    testValueObject: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
      // deploymentUuid: {
      //   transformerType: "getFromParameters",
      //   interpolation: "build",
      //   referenceName: "testDeploymentUuid",
      // },
      pageParams: {},
      queryParams: {},
      contextResults: {},
      extractors: {
        menuList: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          applicationSection: "model",
          parentName: "Menu",
          // parentName: {
          //   transformerType: "getFromParameters",
          //   interpolation: "build",
          //   referencePath: ["entityMenu", "name"],
          // },
          parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          // parentUuid: "0000000-0000-0000-0000-000000000000",
          // parentUuid: {
          //   transformerType: "getFromParameters",
          //   interpolation: "build",
          //   referencePath: ["entityMenu", "uuid"],
          // },
        },
      },
      runtimeTransformers: {
        menu: {
          transformerType: "pickFromList",
          interpolation: "runtime",
          applyTo: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referenceName: "menuList",
          },
          index: 0,
        },
        menuItem: {
          transformerType: "createObject",
          interpolation: "runtime",
          definition: {
            reportUuid: {
              transformerType: "getFromParameters",
              interpolation: "build",
              referenceName: "createEntity_newEntityListReportUuid",
            },
            label: {
              transformerType: "mustacheStringTemplate",
              interpolation: "build",
              definition: "List of {{newEntityName}}s",
            },
            section: "data",
            selfApplication: {
              transformerType: "getFromParameters",
              interpolation: "build",
              referencePath: ["adminConfigurationDeploymentParis", "uuid"],
            },
            icon: "local_drink",
          },
        },
        updatedMenu: {
          transformerType: "transformer_menu_addItem",
          interpolation: "runtime",
          menuItemReference: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referenceName: "menuItem",
          },
          menuReference: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            referenceName: "menu",
          },
          menuSectionItemInsertionIndex: -1,
        },
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        queryType: {
          type: "literal",
          definition: "boxedQueryWithExtractorCombinerTransformer",
        },
        deploymentUuid: {
          type: "uuid",
          tag: {
            value: {
              id: 1,
              canBeTemplate: true,
              defaultLabel: "Uuid",
              editable: false,
            },
          },
        },
        pageParams: {
          type: "object",
          definition: {},
        },
        queryParams: {
          type: "object",
          definition: {},
        },
        contextResults: {
          type: "object",
          definition: {},
        },
        extractors: {
          type: "object",
          definition: {
            menuList: {
              type: "object",
              definition: {
                extractorOrCombinerType: {
                  type: "literal",
                  definition: "extractorByEntityReturningObjectList",
                },
                applicationSection: {
                  type: "enum",
                  tag: {
                    value: {
                      defaultLabel: "Application Section",
                      initializeTo: {
                        initializeToType: "value",
                        value: "data",
                      },
                    },
                  },
                  definition: ["model", "data"],
                },
                parentName: {
                  type: "string",
                  optional: true,
                  tag: {
                    value: {
                      id: 3,
                      canBeTemplate: true,
                      defaultLabel: "Parent Name",
                      editable: false,
                    },
                  },
                },
                parentUuid: {
                  type: "uuid",
                  tag: {
                    value: {
                      id: 4,
                      editable: false,
                      canBeTemplate: true,
                      defaultLabel: "Parent Uuid",
                      targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      selectorParams: {
                        targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        runtimeTransformers: {
          type: "object",
          optional: true,
          definition: {
            menu: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "pickFromList",
                },
                interpolation: {
                  type: "enum",
                  optional: true,
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Interpolation",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: "build",
                      },
                    },
                  },
                  definition: ["build", "runtime"],
                },
                applyTo: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "literal",
                      definition: "getFromContext",
                    },
                    interpolation: {
                      type: "enum",
                      optional: true,
                      tag: {
                        value: {
                          id: 1,
                          defaultLabel: "Interpolation",
                          editable: true,
                          initializeTo: {
                            initializeToType: "value",
                            value: "build",
                          },
                        },
                      },
                      definition: ["build", "runtime"],
                    },
                    referenceName: {
                      optional: true,
                      type: "string",
                    },
                  },
                  tag: {
                    value: {
                      editable: true,
                      editorButton: {
                        label: "Apply Transformer to a List",
                        transformer: {
                          transformerType: "createObject",
                          definition: {
                            transformerType: "mapList",
                            elementTransformer: {
                              transformerType: "getFromContext",
                              referenceName: "originTransformer",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                index: {
                  type: "number",
                },
              },
              tag: {
                value: {
                  editable: true,
                  editorButton: {
                    label: "Apply Transformer to a List",
                    transformer: {
                      transformerType: "createObject",
                      definition: {
                        transformerType: "mapList",
                        elementTransformer: {
                          transformerType: "getFromContext",
                          referenceName: "originTransformer",
                        },
                      },
                    },
                  },
                },
              },
            },
            menuItem: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "createObject",
                },
                interpolation: {
                  type: "enum",
                  optional: true,
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Interpolation",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: "build",
                      },
                    },
                  },
                  definition: ["build", "runtime"],
                },
                definition: {
                  type: "object",
                  definition: {
                    reportUuid: {
                      type: "object",
                      definition: {
                        transformerType: {
                          type: "literal",
                          definition: "getFromParameters",
                        },
                        interpolation: {
                          type: "enum",
                          optional: true,
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Interpolation",
                              editable: true,
                              initializeTo: {
                                initializeToType: "value",
                                value: "build",
                              },
                            },
                          },
                          definition: ["build", "runtime"],
                        },
                        referenceName: {
                          optional: true,
                          type: "string",
                        },
                      },
                      tag: {
                        value: {
                          editable: true,
                          editorButton: {
                            label: "Apply Transformer to a List",
                            transformer: {
                              transformerType: "createObject",
                              definition: {
                                transformerType: "mapList",
                                elementTransformer: {
                                  transformerType: "getFromContext",
                                  referenceName: "originTransformer",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    label: {
                      type: "object",
                      definition: {
                        transformerType: {
                          type: "literal",
                          definition: "mustacheStringTemplate",
                        },
                        interpolation: {
                          type: "enum",
                          optional: true,
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Interpolation",
                              editable: true,
                              initializeTo: {
                                initializeToType: "value",
                                value: "build",
                              },
                            },
                          },
                          definition: ["build", "runtime"],
                        },
                        definition: {
                          type: "string",
                        },
                      },
                      tag: {
                        value: {
                          editable: true,
                          editorButton: {
                            label: "Apply Transformer to a List",
                            transformer: {
                              transformerType: "createObject",
                              definition: {
                                transformerType: "mapList",
                                elementTransformer: {
                                  transformerType: "getFromContext",
                                  referenceName: "originTransformer",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    section: {
                      type: "string",
                    },
                    selfApplication: {
                      type: "object",
                      definition: {
                        transformerType: {
                          type: "literal",
                          definition: "getFromParameters",
                        },
                        interpolation: {
                          type: "enum",
                          optional: true,
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Interpolation",
                              editable: true,
                              initializeTo: {
                                initializeToType: "value",
                                value: "build",
                              },
                            },
                          },
                          definition: ["build", "runtime"],
                        },
                        referencePath: {
                          optional: true,
                          type: "tuple",
                          definition: [
                            {
                              type: "string",
                            },
                            {
                              type: "string",
                            },
                          ],
                        },
                      },
                      tag: {
                        value: {
                          editable: true,
                          editorButton: {
                            label: "Apply Transformer to a List",
                            transformer: {
                              transformerType: "createObject",
                              definition: {
                                transformerType: "mapList",
                                elementTransformer: {
                                  transformerType: "getFromContext",
                                  referenceName: "originTransformer",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    icon: {
                      type: "string",
                    },
                  },
                },
              },
              tag: {
                value: {
                  editable: true,
                  editorButton: {
                    label: "Apply Transformer to a List",
                    transformer: {
                      transformerType: "createObject",
                      definition: {
                        transformerType: "mapList",
                        elementTransformer: {
                          transformerType: "getFromContext",
                          referenceName: "originTransformer",
                        },
                      },
                    },
                  },
                },
              },
            },
            updatedMenu: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "transformer_menu_addItem",
                },
                interpolation: {
                  type: "enum",
                  optional: true,
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Interpolation",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: "build",
                      },
                    },
                  },
                  definition: ["build", "runtime"],
                },
                menuItemReference: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "literal",
                      definition: "getFromContext",
                    },
                    interpolation: {
                      type: "enum",
                      optional: true,
                      tag: {
                        value: {
                          id: 1,
                          defaultLabel: "Interpolation",
                          editable: true,
                          initializeTo: {
                            initializeToType: "value",
                            value: "build",
                          },
                        },
                      },
                      definition: ["build", "runtime"],
                    },
                    referenceName: {
                      optional: true,
                      type: "string",
                    },
                  },
                  tag: {
                    value: {
                      editable: true,
                      editorButton: {
                        label: "Apply Transformer to a List",
                        transformer: {
                          transformerType: "createObject",
                          definition: {
                            transformerType: "mapList",
                            elementTransformer: {
                              transformerType: "getFromContext",
                              referenceName: "originTransformer",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                menuReference: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "literal",
                      definition: "getFromContext",
                    },
                    interpolation: {
                      type: "enum",
                      optional: true,
                      tag: {
                        value: {
                          id: 1,
                          defaultLabel: "Interpolation",
                          editable: true,
                          initializeTo: {
                            initializeToType: "value",
                            value: "build",
                          },
                        },
                      },
                      definition: ["build", "runtime"],
                    },
                    referenceName: {
                      optional: true,
                      type: "string",
                    },
                  },
                  tag: {
                    value: {
                      editable: true,
                      editorButton: {
                        label: "Apply Transformer to a List",
                        transformer: {
                          transformerType: "createObject",
                          definition: {
                            transformerType: "mapList",
                            elementTransformer: {
                              transformerType: "getFromContext",
                              referenceName: "originTransformer",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                menuSectionItemInsertionIndex: {
                  type: "number",
                  optional: true,
                },
              },
              tag: {
                value: {
                  editable: true,
                  editorButton: {
                    label: "Apply Transformer to a List",
                    transformer: {
                      transformerType: "createObject",
                      definition: {
                        transformerType: "mapList",
                        elementTransformer: {
                          transformerType: "getFromContext",
                          referenceName: "originTransformer",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  // ##########################################################################################
  // ################################## ACTIONS ###############################################
  // ##########################################################################################
  test800: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: castMiroirFundamentalJzodSchema.uuid,
        relativePath: "buildPlusRuntimeCompositeAction",
      },
    },
    testValueObject: {
      actionType: "compositeActionSequence",
      actionLabel: "test",
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        templates: {},
        definition: [
          {
            actionType: "createEntity",
            actionLabel: "createEntity",
            deploymentUuid: {
              transformerType: "getFromParameters",
              interpolation: "build",
              referenceName: "testDeploymentUuid",
            },
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              entities: [
                {
                  entity: {
                    transformerType: "getFromParameters",
                    interpolation: "build",
                    referenceName: "createEntity_newEntity",
                  },
                  entityDefinition: {
                    transformerType: "getFromParameters",
                    interpolation: "build",
                    referenceName: "createEntity_newEntityDefinition",
                  },
                },
              ],
            },
          },
        ],
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        actionType: {
          type: "literal",
          definition: "compositeActionSequence",
        },
        actionLabel: {
          type: "string",
          optional: true,
        },
        application: {
          type: "literal",
          definition: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
        },
        endpoint: {
          type: "literal",
          definition: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        },
        payload: {
          type: "object",
          definition: {
            templates: {
              type: "object",
              optional: true,
              definition: {},
            },
            definition: {
              type: "tuple",
              definition: [
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "createEntity",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    deploymentUuid: {
                      type: "object",
                      definition: {
                        transformerType: {
                          type: "literal",
                          definition: "getFromParameters",
                        },
                        interpolation: {
                          type: "enum",
                          optional: true,
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Interpolation",
                              editable: true,
                              initializeTo: {
                                initializeToType: "value",
                                value: "build",
                              },
                            },
                          },
                          definition: ["build", "runtime"],
                        },
                        referenceName: {
                          optional: true,
                          type: "string",
                        },
                      },
                      tag: {
                        value: {
                          editable: true,
                          editorButton: {
                            label: "Apply Transformer to a List",
                            transformer: {
                              transformerType: "createObject",
                              definition: {
                                transformerType: "mapList",
                                elementTransformer: {
                                  transformerType: "getFromContext",
                                  referenceName: "originTransformer",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    application: {
                      type: "literal",
                      definition: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
                    },
                    endpoint: {
                      type: "literal",
                      definition: "7947ae40-eb34-4149-887b-15a9021e714e",
                    },
                    payload: {
                      type: "object",
                      definition: {
                        entities: {
                          type: "tuple",
                          definition: [
                            {
                              type: "object",
                              definition: {
                                entity: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "literal",
                                      definition: "getFromParameters",
                                    },
                                    interpolation: {
                                      type: "enum",
                                      optional: true,
                                      tag: {
                                        value: {
                                          id: 1,
                                          defaultLabel: "Interpolation",
                                          editable: true,
                                          initializeTo: {
                                            initializeToType: "value",
                                            value: "build",
                                          },
                                        },
                                      },
                                      definition: ["build", "runtime"],
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
                                    },
                                  },
                                  tag: {
                                    value: {
                                      editable: true,
                                      editorButton: {
                                        label: "Apply Transformer to a List",
                                        transformer: {
                                          transformerType: "createObject",
                                          definition: {
                                            transformerType: "mapList",
                                            elementTransformer: {
                                              transformerType: "getFromContext",
                                              referenceName: "originTransformer",
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                entityDefinition: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "literal",
                                      definition: "getFromParameters",
                                    },
                                    interpolation: {
                                      type: "enum",
                                      optional: true,
                                      tag: {
                                        value: {
                                          id: 1,
                                          defaultLabel: "Interpolation",
                                          editable: true,
                                          initializeTo: {
                                            initializeToType: "value",
                                            value: "build",
                                          },
                                        },
                                      },
                                      definition: ["build", "runtime"],
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
                                    },
                                  },
                                  tag: {
                                    value: {
                                      editable: true,
                                      editorButton: {
                                        label: "Apply Transformer to a List",
                                        transformer: {
                                          transformerType: "createObject",
                                          definition: {
                                            transformerType: "mapList",
                                            elementTransformer: {
                                              transformerType: "getFromContext",
                                              referenceName: "originTransformer",
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    expectedKeyMap: undefined,
  },
  // ##########################################################################################
  // TODO: expectedKeyMap is too long to be printed on a 50'000 line terminal
  // test820: {
  //   testSchema: {
  //     type: "schemaReference",
  //     definition: {
  //       absolutePath: castMiroirFundamentalJzodSchema.uuid,
  //       // relativePath: "compositeActionSequence",
  //       relativePath: "buildPlusRuntimeCompositeAction",
  //     },
  //   },
  //   testValueObject:
  //     test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
  //       "create new Entity and reports from spreadsheet"
  //     ].compositeActionSequence,
  //   expectedResolvedSchema: undefined,
  // },
  // // ##########################################################################################
  // // ##########################################################################################
  // // ##########################################################################################
  // // ##########################################################################################
  // // ##########################################################################################
  // // ##########################################################################################
  // // ##########################################################################################
  // // ########################### BOOK ENTITY ######################################
  // // ##########################################################################################
  // // Book entity
  test900: {
    testSchema: {
      type: "object",
      definition: {
        uuid: {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          tag: {
            value: {
              id: 1,
              defaultLabel: "Uuid",
              editable: false,
            },
          },
        },
        parentName: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 2,
              defaultLabel: "Entity Name",
              editable: false,
            },
          },
        },
        parentUuid: {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          tag: {
            value: {
              id: 3,
              defaultLabel: "Entity Uuid",
              editable: false,
            },
          },
        },
        name: {
          type: "string",
          tag: {
            value: {
              id: 4,
              defaultLabel: "Name",
              editable: true,
            },
          },
        },
        author: {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          optional: true,
          tag: {
            value: {
              id: 5,
              defaultLabel: "Author",
              targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              editable: true,
            },
          },
        },
        publisher: {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          optional: true,
          tag: {
            value: {
              id: 5,
              defaultLabel: "Publisher",
              targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
              editable: true,
            },
          },
        },
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        uuid: {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          tag: {
            value: {
              id: 1,
              defaultLabel: "Uuid",
              editable: false,
            },
          },
        },
        parentName: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 2,
              defaultLabel: "Entity Name",
              editable: false,
            },
          },
        },
        parentUuid: {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          tag: {
            value: {
              id: 3,
              defaultLabel: "Entity Uuid",
              editable: false,
            },
          },
        },
        name: {
          type: "string",
          tag: {
            value: {
              id: 4,
              defaultLabel: "Name",
              editable: true,
            },
          },
        },
        author: {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          optional: true,
          tag: {
            value: {
              id: 5,
              defaultLabel: "Author",
              targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              editable: true,
            },
          },
        },
        publisher: {
          type: "string",
          validations: [
            {
              type: "uuid",
            },
          ],
          optional: true,
          tag: {
            value: {
              id: 5,
              defaultLabel: "Publisher",
              targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
              editable: true,
            },
          },
        },
      },
    },
    testValueObject: {
      uuid: "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7",
      parentName: "Book",
      parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      name: "Renata n'importe quoi",
      author: "e4376314-d197-457c-aa5e-d2da5f8d5977",
      publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
    },
  },
  // Book entity definition
  test910: {
    testSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "entityDefinition",
      },
    },
    testValueObject: {
      uuid: "797dd185-0155-43fd-b23f-f6d0af8cae06",
      parentName: "EntityDefinition",
      parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
      entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      conceptLevel: "Model",
      name: "Book",
      icon: "Book",
      defaultInstanceDetailsReportUuid: "c3503412-3d8a-43ef-a168-aa36e975e606",
      viewAttributes: ["name", "author", "publisher", "uuid"],
      jzodSchema: {
        type: "object",
        definition: {
          uuid: {
            type: "uuid",
            tag: {
              value: {
                id: 1,
                defaultLabel: "Uuid",
                editable: false,
              },
            },
          },
          parentName: {
            type: "string",
            optional: true,
            tag: {
              value: {
                id: 2,
                defaultLabel: "Entity Name",
                editable: false,
              },
            },
          },
          parentUuid: {
            type: "uuid",
            tag: {
              value: {
                id: 3,
                defaultLabel: "Entity Uuid",
                editable: false,
              },
            },
          },
          conceptLevel: {
            type: "enum",
            definition: ["MetaModel", "Model", "Data"],
            optional: true,
            tag: {
              value: {
                id: 5,
                defaultLabel: "Concept Level",
                editable: false,
              },
            },
          },
          name: {
            type: "string",
            tag: {
              value: {
                id: 4,
                defaultLabel: "Name",
                editable: true,
              },
            },
          },
          author: {
            type: "uuid",
            optional: true,
            tag: {
              value: {
                id: 5,
                defaultLabel: "Author",
                targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                editable: true,
              },
            },
          },
          publisher: {
            type: "uuid",
            optional: true,
            tag: {
              value: {
                id: 5,
                defaultLabel: "Publisher",
                targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
                editable: true,
              },
            },
          },
        },
      },
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        uuid: {
          type: "uuid",
          tag: {
            value: {
              id: 1,
              defaultLabel: "Uuid",
              editable: false,
            },
          },
        },
        parentName: {
          type: "string",
          tag: {
            value: {
              id: 2,
              defaultLabel: "Entity Name",
              editable: false,
            },
          },
        },
        parentUuid: {
          type: "uuid",
          tag: {
            value: {
              id: 3,
              defaultLabel: "Entity Uuid",
              editable: false,
            },
          },
        },
        parentDefinitionVersionUuid: {
          type: "uuid",
          optional: true,
          tag: {
            value: {
              id: 4,
              defaultLabel: "Entity Definition Version Uuid",
              editable: false,
            },
          },
        },
        entityUuid: {
          type: "uuid",
          tag: {
            value: {
              id: 6,
              defaultLabel: "Entity Uuid of the Entity which this definition is the definition",
              editable: false,
            },
          },
        },
        conceptLevel: {
          type: "enum",
          definition: ["MetaModel", "Model", "Data"],
          optional: true,
          tag: {
            value: {
              id: 7,
              defaultLabel: "Concept Level",
              editable: false,
            },
          },
        },
        name: {
          type: "string",
          tag: {
            value: {
              id: 5,
              defaultLabel: "Name",
              editable: false,
            },
          },
        },
        icon: {
          type: "string",
        },
        defaultInstanceDetailsReportUuid: {
          type: "uuid",
          optional: true,
          tag: {
            value: {
              id: 9,
              defaultLabel: "Default Report used to display instances of this Entity",
              editable: false,
              selectorParams: {
                targetEntity: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
                targetEntityApplicationSection: "model",
                targetEntityOrderInstancesBy: "name",
              },
            },
          },
        },
        viewAttributes: {
          type: "tuple",
          optional: true,
          definition: [
            {
              type: "string",
            },
            {
              type: "string",
            },
            {
              type: "string",
            },
            {
              type: "string",
            },
          ],
          tag: {
            value: {
              id: 10,
              editable: true,
            },
          },
        },
        jzodSchema: {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "object",
            },
            definition: {
              type: "object",
              definition: {
                uuid: {
                  type: "object",
                  definition: {
                    type: {
                      type: "enum",
                      tag: {
                        value: {
                          description:
                            "The type of a plain attribute (not object, not array) with no validation.",
                          editable: true,
                          initializeTo: {
                            initializeToType: "value",
                            value: "any",
                          },
                        },
                      },
                      definition: [
                        "any",
                        "bigint",
                        "boolean",
                        "never",
                        "null",
                        "uuid",
                        "undefined",
                        "unknown",
                        "void",
                      ],
                    },
                    tag: {
                      type: "object",
                      optional: true,
                      definition: {
                        value: {
                          type: "object",
                          optional: true,
                          definition: {
                            id: {
                              type: "number",
                              optional: true,
                            },
                            defaultLabel: {
                              type: "string",
                              optional: true,
                            },
                            editable: {
                              type: "boolean",
                              optional: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  tag: {
                    value: {
                      description: "A plain attribute (not object, not array) with no validation.",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: null,
                      },
                    },
                  },
                },
                parentName: {
                  type: "object",
                  definition: {
                    type: {
                      type: "literal",
                      definition: "string",
                    },
                    optional: {
                      type: "boolean",
                      optional: true,
                    },
                    tag: {
                      type: "object",
                      optional: true,
                      definition: {
                        value: {
                          type: "object",
                          optional: true,
                          definition: {
                            id: {
                              type: "number",
                              optional: true,
                            },
                            defaultLabel: {
                              type: "string",
                              optional: true,
                            },
                            editable: {
                              type: "boolean",
                              optional: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  tag: {
                    optional: true,
                    schema: {
                      optional: true,
                      metaSchema: {
                        type: "object",
                        optional: true,
                        definition: {
                          optional: {
                            type: "boolean",
                            optional: true,
                          },
                          metaSchema: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                          valueSchema: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                        },
                      },
                      valueSchema: {
                        type: "object",
                        optional: true,
                        definition: {
                          id: {
                            type: "number",
                            optional: true,
                          },
                          defaultLabel: {
                            type: "string",
                            optional: true,
                          },
                          description: {
                            type: "string",
                            optional: true,
                          },
                          editorButton: {
                            type: "object",
                            optional: true,
                            definition: {
                              icon: {
                                type: "string",
                                optional: true,
                              },
                              label: {
                                type: "string",
                                optional: true,
                              },
                              tooltip: {
                                type: "string",
                                optional: true,
                              },
                              transformer: {
                                type: "any",
                                tag: {
                                  value: {
                                    ifThenElseMMLS: {
                                      mmlsReference: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath: "transformerForBuild",
                                      },
                                    },
                                  },
                                },
                                optional: true,
                              },
                            },
                          },
                          initializeTo: {
                            type: "union",
                            discriminator: "initializeToType",
                            optional: true,
                            definition: [
                              {
                                type: "object",
                                optional: true,
                                definition: {
                                  initializeToType: {
                                    type: "literal",
                                    definition: "value",
                                  },
                                  value: {
                                    type: "any",
                                    optional: true,
                                  },
                                },
                              },
                              {
                                type: "object",
                                optional: true,
                                definition: {
                                  initializeToType: {
                                    type: "literal",
                                    definition: "transformer",
                                  },
                                  transformer: {
                                    type: "any",
                                    tag: {
                                      value: {
                                        ifThenElseMMLS: {
                                          mmlsReference: {
                                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                            relativePath: "transformerForBuild",
                                          },
                                        },
                                      },
                                    },
                                    optional: true,
                                  },
                                },
                              },
                            ],
                          },
                          isBlob: {
                            type: "boolean",
                            optional: true,
                          },
                          selectorParams: {
                            type: "object",
                            optional: true,
                            definition: {
                              targetApplicationUuid: {
                                type: "uuid",
                                optional: true,
                              },
                              targetDeploymentUuid: {
                                type: "uuid",
                                optional: true,
                              },
                              targetEntityApplicationSection: {
                                type: "enum",
                                optional: true,
                                definition: ["model", "data", "metaModel"],
                              },
                              targetEntity: {
                                type: "uuid",
                              },
                              targetEntityOrderInstancesBy: {
                                type: "string",
                                optional: true,
                              },
                            },
                          },
                          targetEntity: {
                            type: "string",
                            optional: true,
                          },
                          targetEntityOrderInstancesBy: {
                            type: "string",
                            optional: true,
                          },
                          targetEntityApplicationSection: {
                            type: "enum",
                            optional: true,
                            definition: ["model", "data", "metaModel"],
                          },
                          editable: {
                            type: "boolean",
                            optional: true,
                          },
                          canBeTemplate: {
                            type: "boolean",
                            optional: true,
                          },
                          isTemplate: {
                            type: "boolean",
                            optional: true,
                          },
                          ifThenElseMMLS: {
                            type: "object",
                            optional: true,
                            definition: {
                              parentUuid: {
                                type: "union",
                                optional: true,
                                definition: [
                                  {
                                    type: "string",
                                  },
                                  {
                                    type: "object",
                                    definition: {
                                      path: {
                                        type: "union",
                                        definition: [
                                          {
                                            type: "string",
                                          },
                                          {
                                            type: "object",
                                            definition: {
                                              defaultValuePath: {
                                                type: "string",
                                              },
                                              typeCheckPath: {
                                                type: "string",
                                              },
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                ],
                              },
                              mmlsReference: {
                                type: "object",
                                optional: true,
                                definition: {
                                  absolutePath: {
                                    type: "string",
                                    optional: true,
                                  },
                                  relativePath: {
                                    type: "string",
                                  },
                                },
                              },
                            },
                          },
                          display: {
                            type: "object",
                            optional: true,
                            definition: {
                              displayedAttributeValueWhenFolded: {
                                type: "string",
                                optional: true,
                              },
                              hidden: {
                                type: "union",
                                optional: true,
                                discriminator: "transformerType",
                                definition: [
                                  {
                                    type: "boolean",
                                  },
                                  {
                                    type: "schemaReference",
                                    definition: {
                                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      relativePath: "transformerForBuildPlusRuntime",
                                    },
                                  },
                                ],
                              },
                              uuid: {
                                type: "object",
                                optional: true,
                                definition: {
                                  selector: {
                                    type: "enum",
                                    optional: true,
                                    definition: ["portalSelector", "muiSelector"],
                                  },
                                },
                              },
                              objectUuidAttributeLabelPosition: {
                                type: "enum",
                                optional: true,
                                definition: ["left", "stacked", "hidden"],
                              },
                              objectHideDeleteButton: {
                                type: "boolean",
                                optional: true,
                              },
                              objectHideOptionalButton: {
                                type: "boolean",
                                optional: true,
                              },
                              objectWithoutHeader: {
                                type: "boolean",
                                optional: true,
                              },
                              objectAttributesNoIndent: {
                                type: "boolean",
                                optional: true,
                              },
                              objectOrArrayWithoutFrame: {
                                type: "boolean",
                                optional: true,
                              },
                              unfoldSubLevels: {
                                type: "number",
                                optional: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                parentUuid: {
                  type: "object",
                  definition: {
                    type: {
                      type: "enum",
                      tag: {
                        value: {
                          description:
                            "The type of a plain attribute (not object, not array) with no validation.",
                          editable: true,
                          initializeTo: {
                            initializeToType: "value",
                            value: "any",
                          },
                        },
                      },
                      definition: [
                        "any",
                        "bigint",
                        "boolean",
                        "never",
                        "null",
                        "uuid",
                        "undefined",
                        "unknown",
                        "void",
                      ],
                    },
                    tag: {
                      type: "object",
                      optional: true,
                      definition: {
                        value: {
                          type: "object",
                          optional: true,
                          definition: {
                            id: {
                              type: "number",
                              optional: true,
                            },
                            defaultLabel: {
                              type: "string",
                              optional: true,
                            },
                            editable: {
                              type: "boolean",
                              optional: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  tag: {
                    value: {
                      description: "A plain attribute (not object, not array) with no validation.",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: null,
                      },
                    },
                  },
                },
                conceptLevel: {
                  type: "object",
                  definition: {
                    type: {
                      type: "literal",
                      definition: "enum",
                    },
                    definition: {
                      type: "tuple",
                      definition: [
                        {
                          type: "string",
                        },
                        {
                          type: "string",
                        },
                        {
                          type: "string",
                        },
                      ],
                    },
                    optional: {
                      type: "boolean",
                      optional: true,
                    },
                    tag: {
                      type: "object",
                      optional: true,
                      definition: {
                        value: {
                          type: "object",
                          optional: true,
                          definition: {
                            id: {
                              type: "number",
                              optional: true,
                            },
                            defaultLabel: {
                              type: "string",
                              optional: true,
                            },
                            editable: {
                              type: "boolean",
                              optional: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  tag: {
                    optional: true,
                    schema: {
                      optional: true,
                      metaSchema: {
                        type: "object",
                        optional: true,
                        definition: {
                          optional: {
                            type: "boolean",
                            optional: true,
                          },
                          metaSchema: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                          valueSchema: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                        },
                      },
                      valueSchema: {
                        type: "object",
                        optional: true,
                        definition: {
                          id: {
                            type: "number",
                            optional: true,
                          },
                          defaultLabel: {
                            type: "string",
                            optional: true,
                          },
                          description: {
                            type: "string",
                            optional: true,
                          },
                          editorButton: {
                            type: "object",
                            optional: true,
                            definition: {
                              icon: {
                                type: "string",
                                optional: true,
                              },
                              label: {
                                type: "string",
                                optional: true,
                              },
                              tooltip: {
                                type: "string",
                                optional: true,
                              },
                              transformer: {
                                type: "any",
                                tag: {
                                  value: {
                                    ifThenElseMMLS: {
                                      mmlsReference: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath: "transformerForBuild",
                                      },
                                    },
                                  },
                                },
                                optional: true,
                              },
                            },
                          },
                          initializeTo: {
                            type: "union",
                            discriminator: "initializeToType",
                            optional: true,
                            definition: [
                              {
                                type: "object",
                                optional: true,
                                definition: {
                                  initializeToType: {
                                    type: "literal",
                                    definition: "value",
                                  },
                                  value: {
                                    type: "any",
                                    optional: true,
                                  },
                                },
                              },
                              {
                                type: "object",
                                optional: true,
                                definition: {
                                  initializeToType: {
                                    type: "literal",
                                    definition: "transformer",
                                  },
                                  transformer: {
                                    type: "any",
                                    tag: {
                                      value: {
                                        ifThenElseMMLS: {
                                          mmlsReference: {
                                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                            relativePath: "transformerForBuild",
                                          },
                                        },
                                      },
                                    },
                                    optional: true,
                                  },
                                },
                              },
                            ],
                          },
                          isBlob: {
                            type: "boolean",
                            optional: true,
                          },
                          selectorParams: {
                            type: "object",
                            optional: true,
                            definition: {
                              targetApplicationUuid: {
                                type: "uuid",
                                optional: true,
                              },
                              targetDeploymentUuid: {
                                type: "uuid",
                                optional: true,
                              },
                              targetEntityApplicationSection: {
                                type: "enum",
                                optional: true,
                                definition: ["model", "data", "metaModel"],
                              },
                              targetEntity: {
                                type: "uuid",
                              },
                              targetEntityOrderInstancesBy: {
                                type: "string",
                                optional: true,
                              },
                            },
                          },
                          targetEntity: {
                            type: "string",
                            optional: true,
                          },
                          targetEntityOrderInstancesBy: {
                            type: "string",
                            optional: true,
                          },
                          targetEntityApplicationSection: {
                            type: "enum",
                            optional: true,
                            definition: ["model", "data", "metaModel"],
                          },
                          editable: {
                            type: "boolean",
                            optional: true,
                          },
                          canBeTemplate: {
                            type: "boolean",
                            optional: true,
                          },
                          isTemplate: {
                            type: "boolean",
                            optional: true,
                          },
                          ifThenElseMMLS: {
                            type: "object",
                            optional: true,
                            definition: {
                              parentUuid: {
                                type: "union",
                                optional: true,
                                definition: [
                                  {
                                    type: "string",
                                  },
                                  {
                                    type: "object",
                                    definition: {
                                      path: {
                                        type: "union",
                                        definition: [
                                          {
                                            type: "string",
                                          },
                                          {
                                            type: "object",
                                            definition: {
                                              defaultValuePath: {
                                                type: "string",
                                              },
                                              typeCheckPath: {
                                                type: "string",
                                              },
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                ],
                              },
                              mmlsReference: {
                                type: "object",
                                optional: true,
                                definition: {
                                  absolutePath: {
                                    type: "string",
                                    optional: true,
                                  },
                                  relativePath: {
                                    type: "string",
                                  },
                                },
                              },
                            },
                          },
                          display: {
                            type: "object",
                            optional: true,
                            definition: {
                              displayedAttributeValueWhenFolded: {
                                type: "string",
                                optional: true,
                              },
                              hidden: {
                                type: "union",
                                optional: true,
                                discriminator: "transformerType",
                                definition: [
                                  {
                                    type: "boolean",
                                  },
                                  {
                                    type: "schemaReference",
                                    definition: {
                                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      relativePath: "transformerForBuildPlusRuntime",
                                    },
                                  },
                                ],
                              },
                              uuid: {
                                type: "object",
                                optional: true,
                                definition: {
                                  selector: {
                                    type: "enum",
                                    optional: true,
                                    definition: ["portalSelector", "muiSelector"],
                                  },
                                },
                              },
                              objectUuidAttributeLabelPosition: {
                                type: "enum",
                                optional: true,
                                definition: ["left", "stacked", "hidden"],
                              },
                              objectHideDeleteButton: {
                                type: "boolean",
                                optional: true,
                              },
                              objectHideOptionalButton: {
                                type: "boolean",
                                optional: true,
                              },
                              objectWithoutHeader: {
                                type: "boolean",
                                optional: true,
                              },
                              objectAttributesNoIndent: {
                                type: "boolean",
                                optional: true,
                              },
                              objectOrArrayWithoutFrame: {
                                type: "boolean",
                                optional: true,
                              },
                              unfoldSubLevels: {
                                type: "number",
                                optional: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                name: {
                  type: "object",
                  definition: {
                    type: {
                      type: "literal",
                      definition: "string",
                    },
                    tag: {
                      type: "object",
                      optional: true,
                      definition: {
                        value: {
                          type: "object",
                          optional: true,
                          definition: {
                            id: {
                              type: "number",
                              optional: true,
                            },
                            defaultLabel: {
                              type: "string",
                              optional: true,
                            },
                            editable: {
                              type: "boolean",
                              optional: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  tag: {
                    optional: true,
                    schema: {
                      optional: true,
                      metaSchema: {
                        type: "object",
                        optional: true,
                        definition: {
                          optional: {
                            type: "boolean",
                            optional: true,
                          },
                          metaSchema: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                          valueSchema: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                        },
                      },
                      valueSchema: {
                        type: "object",
                        optional: true,
                        definition: {
                          id: {
                            type: "number",
                            optional: true,
                          },
                          defaultLabel: {
                            type: "string",
                            optional: true,
                          },
                          description: {
                            type: "string",
                            optional: true,
                          },
                          editorButton: {
                            type: "object",
                            optional: true,
                            definition: {
                              icon: {
                                type: "string",
                                optional: true,
                              },
                              label: {
                                type: "string",
                                optional: true,
                              },
                              tooltip: {
                                type: "string",
                                optional: true,
                              },
                              transformer: {
                                type: "any",
                                tag: {
                                  value: {
                                    ifThenElseMMLS: {
                                      mmlsReference: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath: "transformerForBuild",
                                      },
                                    },
                                  },
                                },
                                optional: true,
                              },
                            },
                          },
                          initializeTo: {
                            type: "union",
                            discriminator: "initializeToType",
                            optional: true,
                            definition: [
                              {
                                type: "object",
                                optional: true,
                                definition: {
                                  initializeToType: {
                                    type: "literal",
                                    definition: "value",
                                  },
                                  value: {
                                    type: "any",
                                    optional: true,
                                  },
                                },
                              },
                              {
                                type: "object",
                                optional: true,
                                definition: {
                                  initializeToType: {
                                    type: "literal",
                                    definition: "transformer",
                                  },
                                  transformer: {
                                    type: "any",
                                    tag: {
                                      value: {
                                        ifThenElseMMLS: {
                                          mmlsReference: {
                                            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                            relativePath: "transformerForBuild",
                                          },
                                        },
                                      },
                                    },
                                    optional: true,
                                  },
                                },
                              },
                            ],
                          },
                          isBlob: {
                            type: "boolean",
                            optional: true,
                          },
                          selectorParams: {
                            type: "object",
                            optional: true,
                            definition: {
                              targetApplicationUuid: {
                                type: "uuid",
                                optional: true,
                              },
                              targetDeploymentUuid: {
                                type: "uuid",
                                optional: true,
                              },
                              targetEntityApplicationSection: {
                                type: "enum",
                                optional: true,
                                definition: ["model", "data", "metaModel"],
                              },
                              targetEntity: {
                                type: "uuid",
                              },
                              targetEntityOrderInstancesBy: {
                                type: "string",
                                optional: true,
                              },
                            },
                          },
                          targetEntity: {
                            type: "string",
                            optional: true,
                          },
                          targetEntityOrderInstancesBy: {
                            type: "string",
                            optional: true,
                          },
                          targetEntityApplicationSection: {
                            type: "enum",
                            optional: true,
                            definition: ["model", "data", "metaModel"],
                          },
                          editable: {
                            type: "boolean",
                            optional: true,
                          },
                          canBeTemplate: {
                            type: "boolean",
                            optional: true,
                          },
                          isTemplate: {
                            type: "boolean",
                            optional: true,
                          },
                          ifThenElseMMLS: {
                            type: "object",
                            optional: true,
                            definition: {
                              parentUuid: {
                                type: "union",
                                optional: true,
                                definition: [
                                  {
                                    type: "string",
                                  },
                                  {
                                    type: "object",
                                    definition: {
                                      path: {
                                        type: "union",
                                        definition: [
                                          {
                                            type: "string",
                                          },
                                          {
                                            type: "object",
                                            definition: {
                                              defaultValuePath: {
                                                type: "string",
                                              },
                                              typeCheckPath: {
                                                type: "string",
                                              },
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                ],
                              },
                              mmlsReference: {
                                type: "object",
                                optional: true,
                                definition: {
                                  absolutePath: {
                                    type: "string",
                                    optional: true,
                                  },
                                  relativePath: {
                                    type: "string",
                                  },
                                },
                              },
                            },
                          },
                          display: {
                            type: "object",
                            optional: true,
                            definition: {
                              displayedAttributeValueWhenFolded: {
                                type: "string",
                                optional: true,
                              },
                              hidden: {
                                type: "union",
                                optional: true,
                                discriminator: "transformerType",
                                definition: [
                                  {
                                    type: "boolean",
                                  },
                                  {
                                    type: "schemaReference",
                                    definition: {
                                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      relativePath: "transformerForBuildPlusRuntime",
                                    },
                                  },
                                ],
                              },
                              uuid: {
                                type: "object",
                                optional: true,
                                definition: {
                                  selector: {
                                    type: "enum",
                                    optional: true,
                                    definition: ["portalSelector", "muiSelector"],
                                  },
                                },
                              },
                              objectUuidAttributeLabelPosition: {
                                type: "enum",
                                optional: true,
                                definition: ["left", "stacked", "hidden"],
                              },
                              objectHideDeleteButton: {
                                type: "boolean",
                                optional: true,
                              },
                              objectHideOptionalButton: {
                                type: "boolean",
                                optional: true,
                              },
                              objectWithoutHeader: {
                                type: "boolean",
                                optional: true,
                              },
                              objectAttributesNoIndent: {
                                type: "boolean",
                                optional: true,
                              },
                              objectOrArrayWithoutFrame: {
                                type: "boolean",
                                optional: true,
                              },
                              unfoldSubLevels: {
                                type: "number",
                                optional: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                author: {
                  type: "object",
                  definition: {
                    type: {
                      type: "enum",
                      tag: {
                        value: {
                          description:
                            "The type of a plain attribute (not object, not array) with no validation.",
                          editable: true,
                          initializeTo: {
                            initializeToType: "value",
                            value: "any",
                          },
                        },
                      },
                      definition: [
                        "any",
                        "bigint",
                        "boolean",
                        "never",
                        "null",
                        "uuid",
                        "undefined",
                        "unknown",
                        "void",
                      ],
                    },
                    optional: {
                      type: "boolean",
                      optional: true,
                    },
                    tag: {
                      type: "object",
                      optional: true,
                      definition: {
                        value: {
                          type: "object",
                          optional: true,
                          definition: {
                            id: {
                              type: "number",
                              optional: true,
                            },
                            defaultLabel: {
                              type: "string",
                              optional: true,
                            },
                            targetEntity: {
                              type: "string",
                              optional: true,
                            },
                            editable: {
                              type: "boolean",
                              optional: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  tag: {
                    value: {
                      description: "A plain attribute (not object, not array) with no validation.",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: null,
                      },
                    },
                  },
                },
                publisher: {
                  type: "object",
                  definition: {
                    type: {
                      type: "enum",
                      tag: {
                        value: {
                          description:
                            "The type of a plain attribute (not object, not array) with no validation.",
                          editable: true,
                          initializeTo: {
                            initializeToType: "value",
                            value: "any",
                          },
                        },
                      },
                      definition: [
                        "any",
                        "bigint",
                        "boolean",
                        "never",
                        "null",
                        "uuid",
                        "undefined",
                        "unknown",
                        "void",
                      ],
                    },
                    optional: {
                      type: "boolean",
                      optional: true,
                    },
                    tag: {
                      type: "object",
                      optional: true,
                      definition: {
                        value: {
                          type: "object",
                          optional: true,
                          definition: {
                            id: {
                              type: "number",
                              optional: true,
                            },
                            defaultLabel: {
                              type: "string",
                              optional: true,
                            },
                            targetEntity: {
                              type: "string",
                              optional: true,
                            },
                            editable: {
                              type: "boolean",
                              optional: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  tag: {
                    value: {
                      description: "A plain attribute (not object, not array) with no validation.",
                      editable: true,
                      initializeTo: {
                        initializeToType: "value",
                        value: null,
                      },
                    },
                  },
                },
              },
            },
          },
          tag: {
            value: {
              display: {
                unfoldSubLevels: 2,
              },
            },
          },
        },
      },
    },
  },
  // complexMenu
  test950: {
    testSchema: {
      type: "schemaReference",
      context: {
        menuItem: {
          type: "object",
          definition: {
            label: {
              type: "string",
            },
            section: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "applicationSection",
              },
            },
            selfApplication: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Uuid",
                  editable: false,
                },
              },
            },
            reportUuid: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Uuid",
                  editable: false,
                },
              },
            },
            instanceUuid: {
              type: "string",
              optional: true,
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Uuid",
                  editable: false,
                },
              },
            },
            icon: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
            },
          },
        },
        menuItemArray: {
          type: "array",
          definition: {
            type: "schemaReference",
            definition: {
              relativePath: "menuItem",
            },
          },
        },
        sectionOfMenu: {
          type: "object",
          definition: {
            title: {
              type: "string",
            },
            label: {
              type: "string",
            },
            items: {
              type: "schemaReference",
              definition: {
                relativePath: "menuItemArray",
              },
            },
          },
        },
        simpleMenu: {
          type: "object",
          definition: {
            menuType: {
              type: "literal",
              definition: "simpleMenu",
            },
            definition: {
              type: "schemaReference",
              definition: {
                relativePath: "menuItemArray",
              },
            },
          },
        },
        complexMenu: {
          type: "object",
          definition: {
            menuType: {
              type: "literal",
              definition: "complexMenu",
            },
            definition: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  relativePath: "sectionOfMenu",
                },
              },
            },
          },
        },
        menuDefinition: {
          type: "union",
          discriminator: "menuType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                relativePath: "simpleMenu",
              },
            },
            {
              type: "schemaReference",
              definition: {
                relativePath: "complexMenu",
              },
            },
          ],
        },
      },
      definition: {
        relativePath: "menuDefinition",
      },
    },
    testValueObject: {
      menuType: "complexMenu",
      definition: [
        {
          title: "Miroir",
          label: "miroir",
          items: [
            {
              label: "Miroir Entities",
              section: "model",
              selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
              reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
              icon: "category",
            },
            {
              label: "Miroir Entity Definitions",
              section: "model",
              selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
              reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
              icon: "category",
            },
            {
              label: "Miroir Reports",
              section: "data",
              selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
              reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
              icon: "list",
            },
            {
              label: "Miroir Menus",
              section: "data",
              selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
              reportUuid: "ecfd8787-09cc-417d-8d2c-173633c9f998",
              icon: "list",
            },
          ],
        },
        {
          title: "Library",
          label: "library",
          items: [
            {
              label: "Library Entities",
              section: "model",
              selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
              icon: "category",
            },
            {
              label: "Library Entity Definitions",
              section: "model",
              selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
              icon: "category",
            },
            {
              label: "Library Tests",
              section: "data",
              selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              reportUuid: "931dd036-dfce-4e47-868e-36dba3654816",
              icon: "category",
            },
            {
              label: "Library Books",
              section: "data",
              selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
              icon: "auto_stories",
            },
            {
              label: "Library Authors",
              section: "data",
              selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
              icon: "star",
            },
            {
              label: "Library Publishers",
              section: "data",
              selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
              icon: "account_balance",
            },
          ],
        },
      ],
    },
    expectedResolvedSchema: {
      type: "object",
      definition: {
        menuType: {
          type: "literal",
          definition: "complexMenu",
        },
        definition: {
          type: "tuple",
          definition: [
            {
              type: "object",
              definition: {
                title: {
                  type: "string",
                },
                label: {
                  type: "string",
                },
                items: {
                  type: "tuple",
                  definition: [
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              type: "object",
              definition: {
                title: {
                  type: "string",
                },
                label: {
                  type: "string",
                },
                items: {
                  type: "tuple",
                  definition: [
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        label: {
                          type: "string",
                        },
                        section: {
                          type: "enum",
                          tag: {
                            value: {
                              defaultLabel: "Application Section",
                              initializeTo: {
                                initializeToType: "value",
                                value: "data",
                              },
                            },
                          },
                          definition: ["model", "data"],
                        },
                        selfApplication: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        reportUuid: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                          tag: {
                            value: {
                              id: 1,
                              defaultLabel: "Uuid",
                              editable: false,
                            },
                          },
                        },
                        icon: {
                          type: "string",
                          validations: [
                            {
                              type: "uuid",
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  },
};
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe("jzod.typeCheck", () => {
  it.each(Object.entries(tests))("%s", (testName, testParams) => {
    console.log(expect.getState().currentTestName, "called testResolve", testName);
    testResolve(
      testName,
      testParams.testSchema,
      testParams.testValueObject,
      testParams.expectedResult,
      testParams.expectedResolvedSchema,
      testParams.expectedSubSchema,
      testParams.expectedKeyMap,
    );
  });
});