
import {
  JzodElement,
  JzodObject,
  JzodReference
} from "@miroir-framework/jzod-ts";

import { applyLimitedCarryOnSchema } from "../../src/1_core/jzod/JzodToJzod";
import { JzodReferenceResolutionFunction } from "@miroir-framework/jzod";


interface TestCase {
  name: string,
  testJzodSchema: JzodElement,
  carryOnJzodSchema: JzodObject,
  expectedReferences: Record<string,JzodElement>,
  expectedResult: JzodElement,
  resolveJzodReference?: JzodReferenceResolutionFunction, // non-converted reference lookup
  convertedReferences?: Record<string, JzodElement>, // converted reference lookup
}
function runTest(
  t: TestCase
) {
  const testResult = applyLimitedCarryOnSchema(
    t.testJzodSchema,
    t.carryOnJzodSchema,
    undefined, // prefixForReference
    undefined, // suffixForReference
    t.resolveJzodReference,
    t.convertedReferences
  );
  console.log(t.name, "result references=", JSON.stringify(testResult.resolvedReferences, null, 2))
  console.log(t.name, "result=", JSON.stringify(testResult.resultSchema, null, 2))
  // console.log(t.name, "expectedResult=", JSON.stringify(t.expectedResult, null, 2))
  // console.log(t.name, "expectedReferences=", JSON.stringify(t.expectedReferences, null, 2))
  console.log("running test:", t.name)
  expect(testResult.resultSchema).toEqual(t.expectedResult)
  
  expect(testResult.resolvedReferences).toEqual(t.expectedReferences)
}


// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe(
  'JzodToJzod',
  () => {

    // ###########################################################################################
    it('jzod carryOn conversion',
      () => {
        const tests: TestCase[] = [
          // test000: simple string, canBeTemplate=false
          {
            name: "test000",
            testJzodSchema: {
              type: "string",
            },
            carryOnJzodSchema: {
              type: "object",
              definition: {
                c: { type: "string" },
              },
            },
            expectedResult: {
              type: "string",
            },
            expectedReferences: undefined as any,
          },
          // test001: simple string, canBeTemplate=true
          {
            name: "test001",
            testJzodSchema: {
              type: "string",
              tag: { canBeTemplate: true } as any,
            },
            carryOnJzodSchema: {
              type: "object",
              definition: {
                c: { type: "string" },
              },
            },
            expectedResult: {
              type: "union",
              tag: { canBeTemplate: true } as any,
              definition: [
                {
                  type: "string",
                  tag: { canBeTemplate: true } as any
                },
                {
                  type: "object",
                  definition: {
                    c: {
                      type: "string",
                    },
                  },
                },
              ],
            },
            expectedReferences: undefined as any,
          },
          // test010: simple object schema, no references
          {
            name: "test010",
            testJzodSchema: {
              type: "object",
              definition: {
                a: { type: "string", tag: { canBeTemplate: true } as any },
                b: {
                  type: "object",
                  definition: {
                    b1: { type: "boolean", optional: true },
                    b2: {
                      type: "array",
                      definition: { type: "boolean", tag: { canBeTemplate: true } as any },
                    },
                  },
                },
              },
            },
            carryOnJzodSchema: {
              type: "object",
              definition: {
                c: { type: "string" },
              },
            },
            expectedResult: {
              type: "object",
              definition: {
                a: {
                  type: "union",
                  tag: { canBeTemplate: true } as any,
                  definition: [
                    {
                      type: "string",
                      tag: { canBeTemplate: true } as any,
                    },
                    {
                      type: "object",
                      definition: {
                        c: {
                          type: "string",
                        },
                      },
                    },
                  ],
                },
                b: {
                  type: "object",
                  definition: {
                    b1: {
                      type: "boolean",
                      optional: true,
                    },
                    b2: {
                      type: "array",
                      definition: {
                        type: "union",
                        tag: { canBeTemplate: true } as any,
                        definition: [
                          {
                            type: "boolean",
                            tag: { canBeTemplate: true } as any,
                          },
                          {
                            type: "object",
                            definition: {
                              c: {
                                type: "string",
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
            expectedReferences: {},
          },
          // // test020: absolutePath schemaReference with complex carryOn type
          // {
          //   name: "test020",
          //   testJzodSchema: {
          //     type: "schemaReference",
          //     definition: {
          //       absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //       relativePath: "myObject",
          //     },
          //   },
          //   carryOnJzodSchema: {
          //     type: "object",
          //     definition: {
          //       d: { type: "string" },
          //     },
          //   },
          //   expectedResult: {
          //     type: "schemaReference",
          //     definition: {
          //       absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //       relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myObject",
          //     },
          //   },
          //   expectedReferences: {
          //     carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myObject: {
          //       type: "union",
          //       definition: [
          //         {
          //           type: "object",
          //           definition: {
          //             d: {
          //               type: "string",
          //             },
          //           },
          //         },
          //         {
          //           type: "object",
          //           definition: {
          //             a: {
          //               type: "union",
          //               definition: [
          //                 {
          //                   type: "string",
          //                 },
          //                 {
          //                   type: "object",
          //                   definition: {
          //                     d: {
          //                       type: "string",
          //                     },
          //                   },
          //                 },
          //               ],
          //             },
          //             b: {
          //               type: "schemaReference",
          //               definition: {
          //                 relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myObject",
          //               },
          //             },
          //             c: {
          //               type: "union",
          //               definition: [
          //                 {
          //                   type: "array",
          //                   definition: {
          //                     type: "schemaReference",
          //                     definition: {
          //                       relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myObject",
          //                     },
          //                   },
          //                 },
          //                 {
          //                   type: "object",
          //                   definition: {
          //                     d: {
          //                       type: "string",
          //                     },
          //                   },
          //                 },
          //               ],
          //             },
          //           },
          //         },
          //       ],
          //     },
          //   },
          //   resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
          //     const store: Record<string, JzodReference> = {
          //       "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
          //         type: "schemaReference",
          //         context: {
          //           myObject: {
          //             type: "object",
          //             definition: {
          //               a: { type: "string" },
          //               b: { type: "schemaReference", definition: { relativePath: "myObject" } },
          //               c: {
          //                 type: "array",
          //                 definition: { type: "schemaReference", definition: { relativePath: "myObject" } },
          //               },
          //             },
          //           },
          //           myString: { type: "string" },
          //         },
          //         definition: { relativePath: "myObject" },
          //       },
          //     };
          //     const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
          //     return resolvedAbsolutePath && resolvedAbsolutePath.context
          //       ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
          //       : undefined;
          //   },
          // },
          // // test030: simple base type with absolute schemaReference and simple carryOn type
          // {
          //   name: "test30",
          //   testJzodSchema: {
          //     type: "schemaReference",
          //     definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "myString" },
          //   },
          //   carryOnJzodSchema: {
          //     type: "object",
          //     definition: {
          //       c: { type: "number" },
          //     },
          //   },
          //   resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
          //     const store: Record<string, JzodReference> = {
          //       "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
          //         type: "schemaReference",
          //         context: {
          //           myString: { type: "string" },
          //         },
          //         definition: { relativePath: "myString" },
          //       },
          //     };
          //     const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
          //     return resolvedAbsolutePath && resolvedAbsolutePath.context
          //       ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
          //       : undefined;
          //   },
          //   expectedResult: {
          //     type: "schemaReference",
          //     definition: {
          //       absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //       relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
          //     },
          //   },
          //   expectedReferences: {
          //     carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString: {
          //       type: "union",
          //       definition: [
          //         {
          //           type: "string",
          //         },
          //         {
          //           type: "object",
          //           definition: {
          //             c: {
          //               type: "number",
          //             },
          //           },
          //         },
          //       ],
          //     },
          //   },
          // },
          // // test040: simple base type with absolute schemaReference within object and simple carryOn type
          // {
          //   name: "test040",
          //   testJzodSchema: {
          //     type: "object",
          //     definition: {
          //       a: {
          //         type: "schemaReference",
          //         definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "myString" },
          //       },
          //     },
          //   },
          //   carryOnJzodSchema: {
          //     type: "object",
          //     definition: {
          //       c: { type: "number" },
          //     },
          //   },
          //   resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
          //     const store: Record<string, JzodReference> = {
          //       "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
          //         type: "schemaReference",
          //         context: {
          //           myString: { type: "string" },
          //         },
          //         definition: { relativePath: "myString" },
          //       },
          //     };
          //     const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
          //     return resolvedAbsolutePath && resolvedAbsolutePath.context
          //       ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
          //       : undefined;
          //   },
          //   expectedResult: {
          //     type: "union",
          //     extra: undefined,
          //     optional: undefined,
          //     nullable: undefined,
          //     definition: [
          //       {
          //         type: "object",
          //         definition: {
          //           c: {
          //             type: "number",
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         definition: {
          //           a: {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //               relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
          //             },
          //           },
          //         },
          //       },
          //     ],
          //   },
          //   expectedReferences: {
          //     carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString: {
          //       type: "union",
          //       definition: [
          //         {
          //           type: "string",
          //         },
          //         {
          //           type: "object",
          //           definition: {
          //             c: {
          //               type: "number",
          //             },
          //           },
          //         },
          //       ],
          //     },
          //   },
          // },
          // // test050: simple base type with absolute schemaReference within object and union and simple carryOn type
          // {
          //   name: "test050",
          //   testJzodSchema: {
          //     type: "object",
          //     definition: {
          //       a: {
          //         type: "union",
          //         definition: [
          //           {
          //             type: "schemaReference",
          //             definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "myString" },
          //           },
          //           {
          //             type: "number",
          //           },
          //         ],
          //       },
          //     },
          //   },
          //   carryOnJzodSchema: {
          //     type: "object",
          //     definition: {
          //       c: { type: "number" },
          //     },
          //   },
          //   resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
          //     const store: Record<string, JzodReference> = {
          //       "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
          //         type: "schemaReference",
          //         context: {
          //           myString: { type: "string" },
          //         },
          //         definition: { relativePath: "myString" },
          //       },
          //     };
          //     const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
          //     return resolvedAbsolutePath && resolvedAbsolutePath.context
          //       ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
          //       : undefined;
          //   },
          //   expectedResult: {
          //     type: "union",
          //     definition: [
          //       {
          //         type: "object",
          //         definition: {
          //           c: {
          //             type: "number",
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         definition: {
          //           a: {
          //             type: "union",
          //             definition: [
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //                   relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
          //                 },
          //               },
          //               {
          //                 type: "number",
          //               },
          //               {
          //                 type: "object",
          //                 definition: {
          //                   c: {
          //                     type: "number",
          //                   },
          //                 },
          //               },
          //             ],
          //           },
          //         },
          //       },
          //     ],
          //   },
          //   expectedReferences: {
          //     carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString: {
          //       type: "union",
          //       definition: [
          //         {
          //           type: "string",
          //         },
          //         {
          //           type: "object",
          //           definition: {
          //             c: {
          //               type: "number",
          //             },
          //           },
          //         },
          //       ],
          //     },
          //   },
          // },
          // // test060: complex base type with one inner relative schemaReference and one inner absolute schemaReference, on a simple carryOn type
          // {
          //   name: "test060",
          //   testJzodSchema: {
          //     type: "object",
          //     definition: {
          //       a: {
          //         type: "schemaReference",
          //         context: {
          //           innerString: { type: "string" },
          //         },
          //         definition: { relativePath: "innerString" },
          //       },
          //       b: {
          //         type: "schemaReference",
          //         definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "myString" },
          //       },
          //       d: {
          //         type: "schemaReference",
          //         definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "myString" },
          //       },
          //     },
          //   },
          //   carryOnJzodSchema: {
          //     type: "object",
          //     definition: {
          //       c: { type: "number" },
          //     },
          //   },
          //   resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
          //     const store: Record<string, JzodReference> = {
          //       "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
          //         type: "schemaReference",
          //         context: {
          //           myString: { type: "string" },
          //         },
          //         definition: { relativePath: "myString" },
          //       },
          //     };
          //     const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
          //     return resolvedAbsolutePath && resolvedAbsolutePath.context
          //       ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
          //       : undefined;
          //   },
          //   expectedResult: {
          //     type: "union",
          //     definition: [
          //       {
          //         type: "object",
          //         definition: {
          //           c: {
          //             type: "number",
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         definition: {
          //           a: {
          //             type: "schemaReference",
          //             context: {
          //               innerString: {
          //                 type: "union",
          //                 definition: [
          //                   {
          //                     type: "string",
          //                   },
          //                   {
          //                     type: "object",
          //                     definition: {
          //                       c: {
          //                         type: "number",
          //                       },
          //                     },
          //                   },
          //                 ],
          //               },
          //             },
          //             definition: {
          //               relativePath: "innerString",
          //             },
          //           },
          //           b: {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //               relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
          //             },
          //           },
          //           d: {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //               relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
          //             },
          //           },
          //         },
          //       },
          //     ],
          //   },
          //   expectedReferences: {
          //     carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString: {
          //       type: "union",
          //       definition: [
          //         {
          //           type: "string",
          //         },
          //         {
          //           type: "object",
          //           definition: {
          //             c: {
          //               type: "number",
          //             },
          //           },
          //         },
          //       ],
          //     },
          //   },
          // },
          // // test070: object with extend clause using schemaReference based on absolutePath
          // {
          //   name: "test070",
          //   testJzodSchema: {
          //     type: "object",
          //     extend: {
          //       type: "schemaReference",
          //       definition: {
          //         eager: true,
          //         absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //         relativePath: "extendedObject",
          //       },
          //     },
          //     definition: {
          //       a: { type: "string" },
          //     },
          //   },
          //   carryOnJzodSchema: {
          //     type: "object",
          //     definition: {
          //       c: { type: "number" },
          //     },
          //   },
          //   resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
          //     const store: Record<string, JzodReference> = {
          //       "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
          //         type: "schemaReference",
          //         context: {
          //           extendedObject: { type: "object", definition: { b: { type: "number" } } },
          //         },
          //         definition: { relativePath: "extendedObject" },
          //       },
          //     };
          //     const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
          //     return resolvedAbsolutePath && resolvedAbsolutePath.context
          //       ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
          //       : undefined;
          //   },
          //   expectedResult: {
          //     type: "union",
          //     definition: [
          //       {
          //         type: "object",
          //         definition: {
          //           c: {
          //             type: "number",
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: [
          //           {
          //             type: "schemaReference",
          //             definition: {
          //               eager: true,
          //               absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //               relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject_extend",
          //             },
          //           },
          //         ],
          //         definition: {
          //           a: {
          //             type: "union",
          //             definition: [
          //               {
          //                 type: "string",
          //               },
          //               {
          //                 type: "object",
          //                 definition: {
          //                   c: {
          //                     type: "number",
          //                   },
          //                 },
          //               },
          //             ],
          //           },
          //         },
          //       },
          //     ],
          //   },
          //   expectedReferences: {
          //     carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject_extend: {
          //       type: "union",
          //       definition: [
          //         {
          //           type: "object",
          //           definition: {
          //             c: {
          //               type: "number",
          //             },
          //           },
          //         },
          //         {
          //           type: "object",
          //           definition: {
          //             b: {
          //               type: "union",
          //               definition: [
          //                 {
          //                   type: "number",
          //                 },
          //                 {
          //                   type: "object",
          //                   definition: {
          //                     c: {
          //                       type: "number",
          //                     },
          //                   },
          //                 },
          //               ],
          //             },
          //           },
          //         },
          //       ],
          //     },
          //   },
          // },
          // // test080: object with array extend clause using schemaReference based on absolutePath
          // {
          //   name: "test080",
          //   testJzodSchema: {
          //     type: "object",
          //     extend: [
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           eager: true,
          //           absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //           relativePath: "extendedObject1",
          //         },
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           eager: true,
          //           absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //           relativePath: "extendedObject2",
          //         },
          //       },
          //     ],
          //     definition: {
          //       a: { type: "string" },
          //     },
          //   },
          //   carryOnJzodSchema: {
          //     type: "object",
          //     definition: {
          //       c: { type: "number" },
          //     },
          //   },
          //   resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
          //     const store: Record<string, JzodReference> = {
          //       "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
          //         type: "schemaReference",
          //         context: {
          //           extendedObject1: { type: "object", definition: { b: { type: "number" } } },
          //           extendedObject2: { type: "object", definition: { d: { type: "string" } } },
          //         },
          //         definition: { relativePath: "extendedObject1" },
          //       },
          //     };
          //     const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
          //     return resolvedAbsolutePath && resolvedAbsolutePath.context
          //       ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
          //       : undefined;
          //   },
          //   expectedResult: {
          //     type: "union",
          //     definition: [
          //       {
          //         type: "object",
          //         definition: {
          //           c: {
          //             type: "number",
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: [
          //           {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //               eager: true,
          //               relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject1_extend",
          //             },
          //           },
          //           {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          //               eager: true,
          //               relativePath: "carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject2_extend",
          //             },
          //           },
          //         ],
          //         definition: {
          //           a: {
          //             type: "union",
          //             definition: [
          //               {
          //                 type: "string",
          //               },
          //               {
          //                 type: "object",
          //                 definition: {
          //                   c: {
          //                     type: "number",
          //                   },
          //                 },
          //               },
          //             ],
          //           },
          //         },
          //       },
          //     ],
          //   },
          //   expectedReferences: {
          //     carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject1_extend: {
          //       type: "union",
          //       definition: [
          //         {
          //           type: "object",
          //           definition: {
          //             c: {
          //               type: "number",
          //             },
          //           },
          //         },
          //         {
          //           type: "object",
          //           definition: {
          //             b: {
          //               type: "union",
          //               definition: [
          //                 {
          //                   type: "number",
          //                 },
          //                 {
          //                   type: "object",
          //                   definition: {
          //                     c: {
          //                       type: "number",
          //                     },
          //                   },
          //                 },
          //               ],
          //             },
          //           },
          //         },
          //       ],
          //     },
          //     carryOn_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject2_extend: {
          //       type: "union",
          //       definition: [
          //         {
          //           type: "object",
          //           definition: {
          //             c: {
          //               type: "number",
          //             },
          //           },
          //         },
          //         {
          //           type: "object",
          //           definition: {
          //             d: {
          //               type: "union",
          //               definition: [
          //                 {
          //                   type: "string",
          //                 },
          //                 {
          //                   type: "object",
          //                   definition: {
          //                     c: {
          //                       type: "number",
          //                     },
          //                   },
          //                 },
          //               ],
          //             },
          //           },
          //         },
          //       ],
          //     },
          //   },
          // },
        ];
        for (const t of tests) {
          runTest(t)
        }
      }
    )
  }
)



