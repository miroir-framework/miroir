import { describe, expect, it } from 'vitest';

import test_createEntityAndReportFromSpreadsheetAndUpdateMenu from "../../../src/assets/miroir_data/c37625c7-0b35-4d6a-811d-8181eb978301/ffe6ab3c-8296-4293-8aaf-ebbad1f0ac9a.json";
import entityDefinitionTest from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/d2842a84-3e66-43ee-ac58-7e13b95b01e8.json";

import {
  JzodElement,
  JzodSchema
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { jzodTypeCheck, ResolvedJzodSchemaReturnType } from "../../../src/1_core/jzod/jzodTypeCheck";
import { miroirFundamentalJzodSchemaUuid } from "../../../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema";
import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";


import { defaultMiroirMetaModel } from '../../test_assets/defaultMiroirMetaModel';


const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as JzodSchema;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################


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
    | undefined = undefined
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
    castMiroirFundamentalJzodSchema,
    defaultMiroirMetaModel,
    defaultMiroirMetaModel,
    {}
  );
    if (expectedResult) {
      expect(testResult, testId).toEqual(expectedResult);
    }
    if (expectedResolvedSchema || expectedSubSchemas) {
      // expect(testResult.status).toEqual("ok");
      // console.log("test", testId, "has result", JSON.stringify(testResult.element, null, 2));
      console.log("test", testId, "has result", JSON.stringify(testResult, null, 2));
      expect(testResult.status, testId).toEqual("ok");
      if (testResult.status !== "ok") { // defensive code, never happens
        throw new Error(
          `Test ${testId} failed with status ${testResult.status}: ${JSON.stringify(testResult.error)}`
        );
      }
      expect(testResult.resolvedSchema, testId).toEqual(expectedResolvedSchema);
      if (expectedSubSchemas) {
        console.log("test", testId, "has subSchema", JSON.stringify(testResult.subSchemas, null, 2));
        expect(testResult.subSchemas, testId).toEqual(expectedSubSchemas);
      }
      // TODO: convert the obtained concrete type to a zod schema and validate the given value object with it
    }
  
  // if (testResult.status == "ok") {
  //   expect(testResult.status).toEqual("ok");
  //   // console.log("test", testId, "has result", JSON.stringify(testResult.element, null, 2));
  //   console.log("test", testId, "has result", JSON.stringify(testResult, null, 2));
  //   expect(testResult.resolvedSchema, testId).toEqual(expectedResolvedSchema);
  //   if (expectedSubSchemas) {
  //     console.log("test", testId, "has subSchema", JSON.stringify(testResult.subSchemas, null, 2));
  //     expect(testResult.subSchemas, testId).toEqual(expectedSubSchemas);
  //   }

  //   // TODO: convert the obtained concrete type to a zod schema and validate the given value object with it
  // } else {
  //   console.log("test", testId, "failed with error", testResult.error);
  //   expect(testResult.status, testId).toEqual("ok");
  // }
}

interface testFormat {
  // testId: string,
  // miroirFundamentalJzodSchema: JzodSchema;
  testSchema: JzodElement;
  testValueObject: any;
  expectedResult?: ResolvedJzodSchemaReturnType | undefined,
  expectedResolvedSchema?: JzodElement;
  expectedSubSchema?:
    | ResolvedJzodSchemaReturnType
    | ResolvedJzodSchemaReturnType[]
    | Record<string, ResolvedJzodSchemaReturnType>
    | undefined;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
    const tests: { [k: string]: testFormat } = {
      // plain literal!
      test010: {
        testSchema: {
          type: "literal",
          definition: "myLiteral",
        },
        expectedResolvedSchema: {
          type: "literal",
          definition: "myLiteral",
        },
        testValueObject: "myLiteral",
      },
      // simpleType: string
      test020: {
        testSchema: {
          type: "string",
        },
        expectedResolvedSchema: {
          type: "string",
        },
        testValueObject: "myString",
      },
      // simpleType: boolean TRUE
      test022: {
        testSchema: {
          type: "boolean",
        },
        expectedResolvedSchema: {
          type: "boolean",
        },
        testValueObject: true,
      },
      // simpleType: boolean TRUE
      test024: {
        testSchema: {
          type: "boolean",
        },
        expectedResolvedSchema: {
          type: "boolean",
        },
        testValueObject: false,
      },
      // schemaReference (plain, simpleType, non-recursive)
      test030: {
        testSchema: {
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
          type: "string",
        },
        testValueObject: "myString",
      },
      // schemaReference: object, recursive, 1-level valueObject
      test040: {
        testValueObject: { a: "myString", c: 42 },
        testSchema: {
          type: "schemaReference",
          context: {
            myObject: {
              type: "object",
              definition: {
                a: {
                  type: "union",
                  // optional: true,
                  definition: [
                    {
                      type: "string",
                      optional: true,
                    },
                    {
                      type: "schemaReference",
                      definition: { relativePath: "myObject" },
                    },
                  ],
                },
                b: {
                  type: "string",
                  optional: true,
                },
                c: {
                  type: "number",
                  optional: true,
                },
              },
            },
          },
          definition: { relativePath: "myObject" },
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            a: {
              type: "string",
              optional: true,
            },
            c: {
              type: "number",
              optional: true,
            },
          },
        },
        expectedSubSchema: {
          a: {
            status: "ok",
            valuePath: ["a"],
            typePath: ["ref:myObject", "a"],
            rawSchema: {
              type: "union",
              definition: [
                {
                  type: "string",
                  optional: true,
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "myObject",
                  },
                },
              ],
            },
            resolvedSchema: {
              type: "string",
              optional: true,
            },
          },
          c: {
            status: "ok",
            valuePath: ["c"],
            typePath: ["ref:myObject", "c"],
            rawSchema: {
              type: "number",
              optional: true,
            },
            resolvedSchema: {
              type: "number",
              optional: true,
            },
          },
        } as Record<string, ResolvedJzodSchemaReturnType>,
      },
      // schemaReference: object, recursive, 2-level valueObject
      test050: {
        testValueObject: { a: { a: "myString" } },
        testSchema: {
          type: "schemaReference",
          context: {
            myObject: {
              type: "object",
              definition: {
                a: {
                  type: "union",
                  discriminator: "type",
                  definition: [
                    {
                      type: "string",
                    },
                    {
                      type: "schemaReference",
                      definition: { relativePath: "myObject" },
                    },
                  ],
                },
              },
            },
          },
          definition: { relativePath: "myObject" },
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            a: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          },
        },
        expectedSubSchema: {
          a: {
            status: "ok",
            valuePath: ["a"],
            typePath: ["ref:myObject", "a", "union choice"],
            rawSchema: {
              type: "union",
              discriminator: "type",
              definition: [
                {
                  type: "string",
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "myObject",
                  },
                },
              ],
            },
            resolvedSchema: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
            subSchemas: {
              a: {
                status: "ok",
                valuePath: ["a", "a"],
                typePath: ["ref:myObject", "a", "union choice", "a"],
                rawSchema: {
                  type: "union",
                  discriminator: "type",
                  definition: [
                    {
                      type: "string",
                    },
                    {
                      type: "schemaReference",
                      definition: {
                        relativePath: "myObject",
                      },
                    },
                  ],
                },
                resolvedSchema: {
                  type: "string",
                },
              },
            },
          },
        } as Record<string, ResolvedJzodSchemaReturnType>,
      },
      // schemaReference: object, recursive, 3-level valueObject
      test060: {
        testValueObject: { a: { a: { a: "myString" } } },
        testSchema: {
          type: "schemaReference",
          context: {
            myObject: {
              type: "object",
              definition: {
                a: {
                  type: "union",
                  definition: [
                    {
                      type: "string",
                    },
                    {
                      type: "schemaReference",
                      definition: { relativePath: "myObject" },
                    },
                  ],
                },
              },
            },
          },
          definition: { relativePath: "myObject" },
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            a: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    a: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
      // schemaReference: record of recursive object, with 2-level valueObject
      test070: {
        testSchema: {
          type: "schemaReference",
          context: {
            myObject: {
              type: "object",
              definition: {
                a: {
                  type: "union",
                  definition: [
                    {
                      type: "string",
                    },
                    {
                      type: "schemaReference",
                      definition: { relativePath: "myObject" },
                    },
                  ],
                },
              },
            },
            myRecord: {
              type: "record",
              definition: {
                type: "schemaReference",
                definition: { relativePath: "myObject" },
              },
            },
          },
          definition: { relativePath: "myRecord" },
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            r1: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    a: {
                      type: "string",
                    },
                  },
                },
              },
            },
            r2: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          },
        },
        testValueObject: { r1: { a: { a: "myString" } }, r2: { a: "myString" } },
      },
      // result must be identical to test70, but this time the schemaReference is places inside the record, not the other way around
      test080: {
        testSchema: {
          type: "record",
          definition: {
            type: "schemaReference",
            context: {
              myObject: {
                type: "object",
                definition: {
                  a: {
                    type: "union",
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "schemaReference",
                        definition: { relativePath: "myObject" },
                      },
                    ],
                  },
                },
              },
            },
            definition: { relativePath: "myObject" },
          },
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            r1: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    a: {
                      type: "string",
                    },
                  },
                },
              },
            },
            r2: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          },
        },
        testValueObject: { r1: { a: { a: "myString" } }, r2: { a: "myString" } },
      },
      // array of simpleType
      test090: {
        testValueObject: ["1", "2", "3"],
        testSchema: {
          type: "array",
          definition: {
            type: "string",
          },
        },
        expectedResolvedSchema: {
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
      },
      // array of schemaReference / object
      test100: {
        testValueObject: [{ a: "myString" }],
        testSchema: {
          type: "array",
          definition: {
            type: "schemaReference",
            context: {
              myObject: {
                type: "object",
                definition: {
                  a: {
                    type: "union",
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "schemaReference",
                        definition: { relativePath: "myObject" },
                      },
                    ],
                  },
                },
              },
            },
            definition: { relativePath: "myObject" },
          },
        },
        expectedResolvedSchema: {
          type: "tuple",
          definition: [
            {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          ],
        },
      },
      // array of schemaReference / object
      test110: {
        testSchema: {
          type: "schemaReference",
          context: {
            myObjectRoot: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
            myObject: {
              type: "object",
              extend: {
                type: "schemaReference",
                definition: {
                  relativePath: "myObjectRoot",
                },
              },
              definition: {
                b: {
                  type: "string",
                  optional: true,
                },
              },
            },
          },
          definition: { relativePath: "myObject" },
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            a: {
              type: "string",
            },
            b: {
              type: "string",
              optional: true,
            },
          },
        },
        testValueObject: { a: "myString", b: "anotherString" },
      },
      // simple union Type
      test120: {
        testValueObject: 1, // this is the object
        testSchema: {
          type: "union",
          definition: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        expectedResolvedSchema: {
          type: "number",
        },
      },
      // union between simpleType and object, object value
      test130: {
        testValueObject: { a: "myString" }, // this is the object
        testSchema: {
          type: "union",
          definition: [
            {
              type: "string",
            },
            {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          ],
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            a: {
              type: "string",
            },
          },
        },
      },
      // union between simpleType and object, simpleType value
      test140: {
        testSchema: {
          type: "union",
          definition: [
            {
              type: "string",
            },
            {
              type: "bigint",
            },
            {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          ],
        },
        testValueObject: 42n, // this is the bigint
        expectedResolvedSchema: {
          type: "bigint",
        },
      },
      // union between simpleType and object, object value
      test150: {
        testSchema: {
          type: "union",
          definition: [
            {
              type: "string",
            },
            {
              type: "bigint",
            },
            {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          ],
        },
        testValueObject: { a: "test" }, // this is the bigint
        expectedResolvedSchema: {
          type: "object",
          definition: {
            a: {
              type: "string",
            },
          },
        },
      },
      // union between simpleType and shemaReference pointing to a simple object, object value
      test160: {
        testSchema: {
          type: "union",
          definition: [
            {
              type: "string",
            },
            {
              type: "bigint",
            },
            {
              type: "schemaReference",
              context: {
                // myObjectRoot: {
                //   type: "object",
                //   definition: {
                //     a: {
                //       type: "string",
                //     },
                //   },
                // },
                myObject: {
                  type: "object",
                  // extend: {
                  //   type: "schemaReference",
                  //   definition: { relativePath: "myObjectRoot" },
                  // },
                  definition: {
                    b: {
                      type: "string",
                      optional: true,
                    },
                  },
                },
              },
              definition: { relativePath: "myObject" },
            },
          ],
        },
        testValueObject: { b: "test" }, // this is the object
        expectedResolvedSchema: {
          type: "object",
          definition: {
            // a: {
            //   type: "string",
            // },
            b: {
              type: "string",
              optional: true,
            },
          },
        },
      },
      // // // // TODO: union between simpleTypes and array with simpleType value
      // // // // TODO: union between simpleTypes and array with array value
      // // // // TODO: union between simpleTypes and array and object with array value
      // // // // TODO: union between simpleTypes and array and object with simpleType value
      // // // // TODO: union between simpleTypes and array and object with object value
      // // // // TODO: failing for union between simpleTypes, with object value
      // // // // TODO: union between simpleType and shemaReference pointing to an extended object, object value
      // // // test170: {
      // // //   miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
      // // //   testSchema: {
      // // //     type: "union",
      // // //     definition: [
      // // //       {
      // // //         type: "string",
      // // //       },
      // // //       {
      // // //         type: "bigint",
      // // //       },
      // // //       {
      // // //         type: "schemaReference",
      // // //         context: {
      // // //           myObjectRoot: {
      // // //             type: "object",
      // // //             definition: {
      // // //               a: {
      // // //                 type: "string",
      // // //               },
      // // //             },
      // // //           },
      // // //           myObject: {
      // // //             type: "object",
      // // //             extend: {
      // // //               type: "schemaReference",
      // // //               definition: { relativePath: "myObjectRoot" },
      // // //             },
      // // //             definition: {
      // // //               b: {
      // // //                 type: "string",
      // // //                 optional: true,
      // // //               },
      // // //             },
      // // //           },
      // // //         },
      // // //         definition: { relativePath: "myObject" },
      // // //       },
      // // //     ],
      // // //   },
      // // //   testValueObject: { b: "test"}, // this is the object
      // // //   expectedResolvedSchema: {
      // // //     type: "object",
      // // //     definition: {
      // // //       a: {
      // // //         type: "string",
      // // //       },
      // // //       b: {
      // // //         type: "string",
      // // //         optional: true,
      // // //       },
      // // //     },
      // // //   },
      // // // },
      // #############################################################################################
      // #############################################################################################
      // #############################################################################################
      // #############################################################################################
      // #############################################################################################
      // #############################################################################################
      // #############################################################################################
      // #############################################################################################
      // array of strings
      test180: {
        testValueObject: ["1", "2", "3"],
        testSchema: {
          type: "array",
          definition: {
            type: "string",
          },
        },
        expectedResolvedSchema: {
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
      },
      // array of arrays of strings
      test190: {
        testValueObject: [["1", "2"], ["3"]],
        testSchema: {
          type: "array",
          definition: {
            type: "array",
            definition: {
              type: "string",
            },
          },
        },
        expectedResolvedSchema: {
          type: "tuple",
          definition: [
            {
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
            {
              type: "tuple",
              definition: [
                {
                  type: "string",
                },
              ],
            },
          ],
        },
      },
      // tuple of [string, number]
      test200: {
        testSchema: {
          type: "tuple",
          definition: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        expectedResolvedSchema: {
          type: "tuple",
          definition: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        testValueObject: ["myString", 42],
      },
      // array of tuples of [string, number, bigint]
      test210: {
        testValueObject: [
          ["myString", 42, 100n],
          ["anotherString", 43, 101n],
        ],
        testSchema: {
          type: "array",
          definition: {
            type: "tuple",
            definition: [
              {
                type: "string",
              },
              {
                type: "number",
              },
              {
                type: "bigint",
              },
            ],
          },
        },
        expectedResolvedSchema: {
          type: "tuple",
          definition: [
            {
              type: "tuple",
              definition: [
                {
                  type: "string",
                },
                {
                  type: "number",
                },
                {
                  type: "bigint",
                },
              ],
            },
            {
              type: "tuple",
              definition: [
                {
                  type: "string",
                },
                {
                  type: "number",
                },
                {
                  type: "bigint",
                },
              ],
            },
          ],
        },
      },
      // array of discriminated unions
      test220: {
        testValueObject: [
          { objectType: "a", value: "myString" },
          { objectType: "b", value: 42 },
        ],
        testSchema: {
          type: "array",
          definition: {
            type: "union",
            discriminator: "objectType",
            definition: [
              {
                type: "object",
                definition: {
                  objectType: {
                    type: "literal",
                    definition: "a",
                  },
                  value: {
                    type: "string",
                  },
                },
              },
              {
                type: "object",
                definition: {
                  objectType: {
                    type: "literal",
                    definition: "b",
                  },
                  value: {
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
                objectType: {
                  type: "literal",
                  definition: "a",
                },
                value: {
                  type: "string",
                },
              },
            },
            {
              type: "object",
              definition: {
                objectType: {
                  type: "literal",
                  definition: "b",
                },
                value: {
                  type: "number",
                },
              },
            },
          ],
        },
      },
      // union type for array of references
      test230: {
        testValueObject: [
          {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "transformer_orderBy"
            }
          }
        ],
        testSchema: {
          "type": "union",
          "optional": true,
          "definition": [
            {
              "type": "union",
              "optional": true,
              "discriminator": "type",
              "definition": [
                {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "jzodReference"
                  },
                  "context": {}
                },
                {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "jzodObject"
                  },
                  "context": {}
                }
              ]
            },
            {
              "type": "array",
              "definition": {
                "type": "union",
                "optional": true,
                "discriminator": "type",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "jzodReference"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "jzodObject"
                    },
                    "context": {}
                  }
                ]
              }
            }
          ]
        },
        expectedResolvedSchema: {
          "type": "array",
          "optional": true,
          "definition": {
            "type": "object",
            "definition": {
              "type": {
                "type": "literal",
                "definition": "schemaReference"
              },
              "definition": {
                "type": "object",
                "definition": {
                  "eager": {
                    "type": "boolean",
                    "optional": true
                  },
                  "relativePath": {
                    "type": "string",
                    "optional": true
                  },
                  "absolutePath": {
                    "type": "string",
                    "optional": true
                  }
                }
              }
            }
          }
        }
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
        expectedResolvedSchema: {
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
        },
        testValueObject: { type: "literal", definition: "myLiteral" },
      },
      // JzodSchema: string
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
              definition: "string",
            },
          },
        },
        testValueObject: { type: "string" },
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
        expectedResolvedSchema: {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "object",
            },
            definition: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    type: {
                      type: "literal",
                      definition: "string",
                    },
                  },
                },
              },
            },
          },
        },
        testValueObject: { type: "object", definition: { a: { type: "string" } } },
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
                  optional: true,
                },
              },
            },
          },
        },
      },
      // JzodSchema: schema reference for object with extend clause
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
                },
              },
            },
            definition: {
              type: "object",
              definition: {
                relativePath: {
                  type: "string",
                  optional: true,
                },
              },
            },
          },
        },
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
      },
      // real case, JzodReference
      test360: {
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: castMiroirFundamentalJzodSchema.uuid,
            relativePath: "jzodReference",
          },
        },
        testValueObject: {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "transformer_orderBy"
          }
        },
        expectedResolvedSchema: {
          "type": "object",
          "definition": {
            "type": {
              "type": "literal",
              "definition": "schemaReference"
            },
            "definition": {
              "type": "object",
              "definition": {
                "eager": {
                  "type": "boolean",
                  "optional": true
                },
                "absolutePath": {
                  "type": "string",
                  "optional": true
                },
                "relativePath": {
                  "type": "string",
                  "optional": true
                }
              }
            }
          }
        }
      },
      // ##########################################################################################
      // ####################################### ANY #############################################
      // ##########################################################################################
      test400: {
        testSchema: {
          type: "any",
        },
        testValueObject: "test",
        expectedResolvedSchema: {
          type: "string",
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
      },
      // ##########################################################################################
      // ################################# TRANSFORMERS ###########################################
      // ##########################################################################################
      // Transformers
      // constant
      test600: {
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: castMiroirFundamentalJzodSchema.uuid,
            relativePath: "transformerForBuildPlusRuntime",
          },
        },
        testValueObject: {
          transformerType: "constant",
          interpolation: "build",
          value: "test",
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            transformerType: {
              type: "literal",
              definition: "constant",
            },
            interpolation: {
              type: "literal",
              definition: "build",
            },
            value: {
              type: "string",
            },
          },
        },
      },
      // listPickElement
      test610: {
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: castMiroirFundamentalJzodSchema.uuid,
            relativePath: "transformerForBuildPlusRuntime",
          },
        },
        testValueObject: {
          transformerType: "listPickElement",
          interpolation: "runtime",
          applyTo: {
            referenceType: "referencedTransformer",
            reference: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "menuList",
            },
          },
          index: 0,
        },
        expectedResolvedSchema: {
          type: "object",
          definition: {
            transformerType: {
              type: "literal",
              definition: "listPickElement",
            },
            interpolation: {
              type: "literal",
              definition: "runtime",
            },
            applyTo: {
              type: "object",
              definition: {
                referenceType: {
                  type: "literal",
                  definition: "referencedTransformer",
                },
                reference: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "literal",
                      definition: "contextReference",
                    },
                    interpolation: {
                      type: "literal",
                      optional: true,
                      definition: "runtime",
                    },
                    referenceName: {
                      optional: true,
                      type: "string",
                    },
                  },
                },
              },
            },
            index: {
              type: "number",
            },
          },
        },
      },
      // runtime freeObjectTemplate with inner build transformer
      test620: {
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: castMiroirFundamentalJzodSchema.uuid,
            relativePath: "transformerForBuildPlusRuntime",
          },
        },
        testValueObject: {
          transformerType: "freeObjectTemplate",
          interpolation: "runtime",
          definition: {
            reportUuid: {
              transformerType: "parameterReference",
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
              transformerType: "parameterReference",
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
              definition: "freeObjectTemplate",
            },
            interpolation: {
              type: "literal",
              definition: "runtime",
            },
            definition: {
              type: "object",
              definition: {
                reportUuid: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "literal",
                      definition: "parameterReference",
                    },
                    interpolation: {
                      type: "literal",
                      optional: true,
                      definition: "build",
                    },
                    referenceName: {
                      optional: true,
                      type: "string",
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
                      type: "literal",
                      definition: "build",
                    },
                    definition: {
                      type: "string",
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
                      definition: "parameterReference",
                    },
                    interpolation: {
                      type: "literal",
                      optional: true,
                      definition: "build",
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
                },
                icon: {
                  type: "string",
                },
              },
            },
          },
        },
      },
      // mapperListToList Transformer
      test630: {
        testSchema: {
          "type": "object",
          "definition": {
            "uuid": {
              "type": "uuid",
              "tag": {
                "value": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              }
            },
            "parentName": {
              "type": "string",
              "optional": true,
              "tag": {
                "value": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                }
              }
            },
            "parentUuid": {
              "type": "uuid",
              "tag": {
                "value": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                }
              }
            },
            "parentDefinitionVersionUuid": {
              "type": "uuid",
              "optional": true,
              "tag": {
                "value": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                }
              }
            },
            "name": {
              "type": "string",
              "tag": {
                "value": {
                  "id": 5,
                  "defaultLabel": "Name",
                  "editable": true
                }
              }
            },
            "defaultLabel": {
              "type": "string",
              "tag": {
                "value": {
                  "id": 6,
                  "defaultLabel": "Default Label",
                  "editable": true
                }
              }
            },
            "description": {
              "type": "string",
              "optional": true,
              "tag": {
                "value": {
                  "id": 7,
                  "defaultLabel": "Description",
                  "editable": true
                }
              }
            },
            "transformerInterface": {
              "type": "object",
              "definition": {
                "transformerParameterSchema": {
                  "type": "object",
                  "definition": {
                    "transformerType": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "jzodLiteral"
                      }
                    },
                    "transformerDefinition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "jzodObject"
                      }
                    }
                  }
                },
                "transformerResultSchema": {
                  "type": "schemaReference",
                  "optional": true,
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "jzodElement"
                  }
                }
              }
            },
            "transformerImplementation": {
              "type": "union",
              "discriminator": "transformerImplementationType",
              "definition": [
                {
                  "type": "object",
                  "definition": {
                    "transformerImplementationType": {
                      "type": "literal",
                      "definition": "libraryImplementation"
                    },
                    "inMemoryImplementationFunctionName": {
                      "type": "string"
                    },
                    "sqlImplementationFunctionName": {
                      "type": "string",
                      "optional": true
                    }
                  }
                },
                {
                  "type": "object",
                  "definition": {
                    "transformerImplementationType": {
                      "type": "literal",
                      "definition": "transformer"
                    },
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "transformerForBuildOrRuntime"
                      }
                    }
                  }
                }
              ]
            }
          }
        },
        testValueObject: {
          "uuid": "3ec73049-5e54-40aa-bc86-4c4906d00baa",
          "name": "mapperListToList",
          "defaultLabel": "mapperListToList",
          "description": "Transform a list into another list, running the given transformer on each item of the list",
          "parentUuid": "a557419d-a288-4fb8-8a1e-971c86c113b8",
          "parentDefinitionVersionUuid": "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
          "parentName": "TransformerDefinition",
          "transformerInterface": {
            "transformerParameterSchema": {
              "transformerType": {
                "type": "literal",
                "definition": "mapperListToList"
              },
              "transformerDefinition": {
                "type": "object",
                "extend": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "eager": true,
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "transformer_orderBy"
                    }
                  }
                ],
                "definition": {
                  "applyTo": {
                    "type": "array",
                    "definition": {
                      "type": "any"
                    }
                  },
                  "referenceToOuterObject": {
                    "type": "string"
                  },
                  "elementTransformer": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "transformer_inner_elementTransformer_transformerForBuildPlusRuntime"
                    }
                  }
                }
              }
            },
            "transformerResultSchema": {
              "type": "array",
              "definition": {
                "type": "any"
              }
            }
          },
          "transformerImplementation": {
            "transformerImplementationType": "libraryImplementation",
            "inMemoryImplementationFunctionName": "transformerForBuild_list_listMapperToList_apply",
            "sqlImplementationFunctionName": "sqlStringForMapperListToListTransformer"
          }
        },
        expectedResolvedSchema: {
          "type": "object",
          "definition": {
            "uuid": {
              "type": "uuid",
              "tag": {
                "value": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              }
            },
            "name": {
              "type": "string",
              "tag": {
                "value": {
                  "id": 5,
                  "defaultLabel": "Name",
                  "editable": true
                }
              }
            },
            "defaultLabel": {
              "type": "string",
              "tag": {
                "value": {
                  "id": 6,
                  "defaultLabel": "Default Label",
                  "editable": true
                }
              }
            },
            "description": {
              "type": "string",
              "optional": true,
              "tag": {
                "value": {
                  "id": 7,
                  "defaultLabel": "Description",
                  "editable": true
                }
              }
            },
            "parentUuid": {
              "type": "uuid",
              "tag": {
                "value": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                }
              }
            },
            "parentDefinitionVersionUuid": {
              "type": "uuid",
              "optional": true,
              "tag": {
                "value": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                }
              }
            },
            "parentName": {
              "type": "string",
              "optional": true,
              "tag": {
                "value": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                }
              }
            },
            "transformerInterface": {
              "type": "object",
              "definition": {
                "transformerParameterSchema": {
                  "type": "object",
                  "definition": {
                    "transformerType": {
                      "type": "object",
                      "definition": {
                        "type": {
                          "type": "literal",
                          "definition": "literal"
                        },
                        "definition": {
                          "type": "string"
                        }
                      }
                    },
                    "transformerDefinition": {
                      "type": "object",
                      "definition": {
                        "type": {
                          "type": "literal",
                          "definition": "object"
                        },
                        "extend": {
                          "type": "array",
                          "optional": true,
                          "definition": {
                            "type": "object",
                            "definition": {
                              "type": {
                                "type": "literal",
                                "definition": "schemaReference"
                              },
                              "definition": {
                                "type": "object",
                                "definition": {
                                  "eager": {
                                    "type": "boolean",
                                    "optional": true
                                  },
                                  "absolutePath": {
                                    "type": "string",
                                    "optional": true
                                  },
                                  "relativePath": {
                                    "type": "string",
                                    "optional": true
                                  }
                                }
                              }
                            }
                          }
                        },
                        "definition": {
                          "type": "object",
                          "definition": {
                            "applyTo": {
                              "type": "object",
                              "definition": {
                                "type": {
                                  "type": "literal",
                                  "definition": "array"
                                },
                                "definition": {
                                  "type": "object",
                                  "definition": {
                                    "type": {
                                      "type": "enum",
                                      "definition": [
                                        "any",
                                        "bigint",
                                        "boolean",
                                        "never",
                                        "null",
                                        "uuid",
                                        "undefined",
                                        "unknown",
                                        "void"
                                      ]
                                    }
                                  }
                                }
                              }
                            },
                            "referenceToOuterObject": {
                              "type": "object",
                              "definition": {
                                "type": {
                                  "type": "literal",
                                  "definition": "string"
                                }
                              }
                            },
                            "elementTransformer": {
                              "type": "object",
                              "definition": {
                                "type": {
                                  "type": "literal",
                                  "definition": "schemaReference"
                                },
                                "definition": {
                                  "type": "object",
                                  "definition": {
                                    "absolutePath": {
                                      "type": "string",
                                      "optional": true
                                    },
                                    "relativePath": {
                                      "type": "string",
                                      "optional": true
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                "transformerResultSchema": {
                  "type": "object",
                  "definition": {
                    "type": {
                      "type": "literal",
                      "definition": "array"
                    },
                    "definition": {
                      "type": "object",
                      "definition": {
                        "type": {
                          "type": "enum",
                          "definition": [
                            "any",
                            "bigint",
                            "boolean",
                            "never",
                            "null",
                            "uuid",
                            "undefined",
                            "unknown",
                            "void"
                          ]
                        }
                      }
                    }
                  }
                }
              }
            },
            "transformerImplementation": {
              "type": "object",
              "definition": {
                "transformerImplementationType": {
                  "type": "literal",
                  "definition": "libraryImplementation"
                },
                "inMemoryImplementationFunctionName": {
                  "type": "string"
                },
                "sqlImplementationFunctionName": {
                  "type": "string",
                  "optional": true
                }
              }
            }
          }
        }
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
          //   transformerType: "parameterReference",
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
              //   transformerType: "parameterReference",
              //   interpolation: "build",
              //   referencePath: ["entityMenu", "name"],
              // },
              parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
              // parentUuid: "0000000-0000-0000-0000-000000000000",
              // parentUuid: {
              //   transformerType: "parameterReference",
              //   interpolation: "build",
              //   referencePath: ["entityMenu", "uuid"],
              // },
            },
          },
          runtimeTransformers: {
            menu: {
              transformerType: "listPickElement",
              interpolation: "runtime",
              applyTo: {
                referenceType: "referencedTransformer",
                reference: {
                  transformerType: "contextReference",
                  interpolation: "runtime",
                  referenceName: "menuList",
                },
              },
              index: 0,
            },
            menuItem: {
              transformerType: "freeObjectTemplate",
              interpolation: "runtime",
              definition: {
                reportUuid: {
                  transformerType: "parameterReference",
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
                  transformerType: "parameterReference",
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
                transformerType: "contextReference",
                interpolation: "runtime",
                referenceName: "menuItem",
              },
              menuReference: {
                transformerType: "contextReference",
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
                      type: "literal",
                      definition: "model",
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
                          canBeTemplate: true,
                          targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                          defaultLabel: "Parent Uuid",
                          editable: false,
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
                      definition: "listPickElement",
                    },
                    interpolation: {
                      type: "literal",
                      definition: "runtime",
                    },
                    applyTo: {
                      type: "object",
                      definition: {
                        referenceType: {
                          type: "literal",
                          definition: "referencedTransformer",
                        },
                        reference: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "contextReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "runtime",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
                            },
                          },
                        },
                      },
                    },
                    index: {
                      type: "number",
                    },
                  },
                },
                menuItem: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "literal",
                      definition: "freeObjectTemplate",
                    },
                    interpolation: {
                      type: "literal",
                      definition: "runtime",
                    },
                    definition: {
                      type: "object",
                      definition: {
                        reportUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
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
                              type: "literal",
                              definition: "build",
                            },
                            definition: {
                              type: "string",
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
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
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
                        },
                        icon: {
                          type: "string",
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
                      type: "literal",
                      definition: "runtime",
                    },
                    menuItemReference: {
                      type: "object",
                      definition: {
                        transformerType: {
                          type: "literal",
                          definition: "contextReference",
                        },
                        interpolation: {
                          type: "literal",
                          optional: true,
                          definition: "runtime",
                        },
                        referenceName: {
                          optional: true,
                          type: "string",
                        },
                      },
                    },
                    menuReference: {
                      type: "object",
                      definition: {
                        transformerType: {
                          type: "literal",
                          definition: "contextReference",
                        },
                        interpolation: {
                          type: "literal",
                          optional: true,
                          definition: "runtime",
                        },
                        referenceName: {
                          optional: true,
                          type: "string",
                        },
                      },
                    },
                    menuSectionItemInsertionIndex: {
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
          actionType: "compositeAction",
          actionLabel: "test",
          actionName: "sequence",
          templates: {},
          definition: [
            {
              actionType: "createEntity",
              actionLabel: "createEntity",
              deploymentUuid: {
                transformerType: "parameterReference",
                interpolation: "build",
                referenceName: "testDeploymentUuid",
              },
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              payload: {
                entities: [
                  {
                    entity: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "createEntity_newEntity",
                    },
                    entityDefinition: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "createEntity_newEntityDefinition",
                    },
                  },
                ],
              }
            },
          ],
        },
        expectedResolvedSchema: {
          "type": "object",
          "definition": {
            "actionType": {
              "type": "literal",
              "definition": "compositeAction"
            },
            "actionLabel": {
              "type": "string",
              "optional": true
            },
            "actionName": {
              "type": "literal",
              "definition": "sequence"
            },
            "templates": {
              "type": "object",
              "optional": true,
              "definition": {}
            },
            "definition": {
              "type": "tuple",
              "definition": [
                {
                  "type": "object",
                  "definition": {
                    "actionType": {
                      "type": "literal",
                      "definition": "createEntity"
                    },
                    "actionLabel": {
                      "type": "string",
                      "optional": true
                    },
                    "deploymentUuid": {
                      "type": "object",
                      "definition": {
                        "transformerType": {
                          "type": "literal",
                          "definition": "parameterReference"
                        },
                        "interpolation": {
                          "type": "literal",
                          "optional": true,
                          "definition": "build"
                        },
                        "referenceName": {
                          "optional": true,
                          "type": "string"
                        }
                      }
                    },
                    "endpoint": {
                      "type": "literal",
                      "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                    },
                    "payload": {
                      type: "object",
                      definition: {
                        "entities": {
                          "type": "tuple",
                          "definition": [
                            {
                              "type": "object",
                              "definition": {
                                "entity": {
                                  "type": "object",
                                  "definition": {
                                    "transformerType": {
                                      "type": "literal",
                                      "definition": "parameterReference"
                                    },
                                    "interpolation": {
                                      "type": "literal",
                                      "optional": true,
                                      "definition": "build"
                                    },
                                    "referenceName": {
                                      "optional": true,
                                      "type": "string"
                                    }
                                  }
                                },
                                "entityDefinition": {
                                  "type": "object",
                                  "definition": {
                                    "transformerType": {
                                      "type": "literal",
                                      "definition": "parameterReference"
                                    },
                                    "interpolation": {
                                      "type": "literal",
                                      "optional": true,
                                      "definition": "build"
                                    },
                                    "referenceName": {
                                      "optional": true,
                                      "type": "string"
                                    }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        },
      },
      // ##########################################################################################
      test820: {
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: castMiroirFundamentalJzodSchema.uuid,
            // relativePath: "compositeAction",
            relativePath: "buildPlusRuntimeCompositeAction",
          },
        },
        testValueObject:
          test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
            "create new Entity and reports from spreadsheet"
          ].compositeAction,
        expectedResolvedSchema: {
          type: "object",
          definition: {
            actionType: {
              type: "literal",
              definition: "compositeAction",
            },
            actionLabel: {
              type: "string",
              optional: true,
            },
            actionName: {
              type: "literal",
              definition: "sequence",
            },
            templates: {
              type: "object",
              optional: true,
              definition: {
                createEntity_newEntity: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "string",
                    },
                    interpolation: {
                      type: "string",
                    },
                    definition: {
                      type: "object",
                      definition: {
                        uuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        parentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referencePath: {
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
                        },
                        selfApplication: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        description: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        name: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                createEntity_newEntityDefinition: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "string",
                    },
                    interpolation: {
                      type: "string",
                    },
                    definition: {
                      type: "object",
                      definition: {
                        name: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        uuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        parentName: {
                          type: "string",
                        },
                        parentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referencePath: {
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
                        },
                        entityUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referencePath: {
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
                        },
                        conceptLevel: {
                          type: "string",
                        },
                        defaultInstanceDetailsReportUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        jzodSchema: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                newEntityListReport: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "string",
                    },
                    interpolation: {
                      type: "string",
                    },
                    definition: {
                      type: "object",
                      definition: {
                        uuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        selfApplication: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        parentName: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            value: {
                              type: "string",
                            },
                          },
                        },
                        parentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            definition: {
                              type: "string",
                            },
                          },
                        },
                        conceptLevel: {
                          type: "string",
                        },
                        name: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            definition: {
                              type: "string",
                            },
                          },
                        },
                        defaultLabel: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            definition: {
                              type: "string",
                            },
                          },
                        },
                        type: {
                          type: "string",
                        },
                        definition: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            definition: {
                              type: "object",
                              definition: {
                                extractors: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "string",
                                    },
                                    interpolation: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        instanceList: {
                                          type: "object",
                                          definition: {
                                            extractorOrCombinerType: {
                                              type: "string",
                                            },
                                            parentName: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                referenceName: {
                                                  type: "string",
                                                },
                                              },
                                            },
                                            parentUuid: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                definition: {
                                                  type: "string",
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                section: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "string",
                                    },
                                    interpolation: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        type: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            value: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        definition: {
                                          type: "object",
                                          definition: {
                                            label: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                definition: {
                                                  type: "string",
                                                },
                                              },
                                            },
                                            parentUuid: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                definition: {
                                                  type: "string",
                                                },
                                              },
                                            },
                                            fetchedDataReference: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                value: {
                                                  type: "string",
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
                          },
                        },
                      },
                    },
                  },
                },
                newEntityDetailsReport: {
                  type: "object",
                  definition: {
                    transformerType: {
                      type: "string",
                    },
                    interpolation: {
                      type: "string",
                    },
                    definition: {
                      type: "object",
                      definition: {
                        uuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        selfApplication: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            referenceName: {
                              type: "string",
                            },
                          },
                        },
                        parentName: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            definition: {
                              type: "string",
                            },
                          },
                        },
                        parentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            definition: {
                              type: "string",
                            },
                          },
                        },
                        conceptLevel: {
                          type: "string",
                        },
                        name: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            definition: {
                              type: "string",
                            },
                          },
                        },
                        defaultLabel: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "string",
                            },
                            interpolation: {
                              type: "string",
                            },
                            definition: {
                              type: "string",
                            },
                          },
                        },
                        definition: {
                          type: "object",
                          definition: {
                            extractorTemplates: {
                              type: "object",
                              definition: {
                                elementToDisplay: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "string",
                                    },
                                    interpolation: {
                                      type: "string",
                                    },
                                    value: {
                                      type: "object",
                                      definition: {
                                        extractorTemplateType: {
                                          type: "string",
                                        },
                                        parentName: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        instanceUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            value: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                referenceName: {
                                                  type: "string",
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
                            section: {
                              type: "object",
                              definition: {
                                type: {
                                  type: "string",
                                },
                                definition: {
                                  type: "tuple",
                                  definition: [
                                    {
                                      type: "object",
                                      definition: {
                                        type: {
                                          type: "string",
                                        },
                                        definition: {
                                          type: "object",
                                          definition: {
                                            label: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                definition: {
                                                  type: "string",
                                                },
                                              },
                                            },
                                            parentUuid: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                definition: {
                                                  type: "string",
                                                },
                                              },
                                            },
                                            fetchedDataReference: {
                                              type: "string",
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
                      },
                    },
                  },
                },
              },
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
                          definition: "parameterReference",
                        },
                        interpolation: {
                          type: "literal",
                          optional: true,
                          definition: "build",
                        },
                        referenceName: {
                          optional: true,
                          type: "string",
                        },
                      },
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
                                      definition: "parameterReference",
                                    },
                                    interpolation: {
                                      type: "literal",
                                      optional: true,
                                      definition: "build",
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
                                    },
                                  },
                                },
                                entityDefinition: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "literal",
                                      definition: "parameterReference",
                                    },
                                    interpolation: {
                                      type: "literal",
                                      optional: true,
                                      definition: "build",
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
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
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "transactionalInstanceAction",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    instanceAction: {
                      type: "object",
                      definition: {
                        actionType: {
                          type: "literal",
                          definition: "createInstance",
                        },
                        deploymentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
                            },
                          },
                        },
                        endpoint: {
                          type: "literal",
                          definition: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                        },
                        payload: {
                          type: "object",
                          definition: {
                            applicationSection: {
                              type: "literal",
                              definition: "model",
                            },
                            objects: {
                              type: "tuple",
                              tag: {
                                value: {
                                  id: 2,
                                  defaultLabel: "Entity Instances to create",
                                  editable: true,
                                },
                              },
                              definition: [
                                {
                                  type: "object",
                                  definition: {
                                    parentName: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "literal",
                                          definition: "parameterReference",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          optional: true,
                                          definition: "build",
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
                                    },
                                    parentUuid: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "literal",
                                          definition: "parameterReference",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          optional: true,
                                          definition: "build",
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
                                    },
                                    applicationSection: {
                                      type: "literal",
                                      definition: "model",
                                    },
                                    instances: {
                                      type: "tuple",
                                      definition: [
                                        {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
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
                          },
                        },
                      },
                    },
                  },
                },
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "commit",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    endpoint: {
                      type: "literal",
                      definition: "7947ae40-eb34-4149-887b-15a9021e714e",
                    },
                    deploymentUuid: {
                      type: "object",
                      definition: {
                        transformerType: {
                          type: "literal",
                          definition: "parameterReference",
                        },
                        interpolation: {
                          type: "literal",
                          optional: true,
                          definition: "build",
                        },
                        referenceName: {
                          optional: true,
                          type: "string",
                        },
                      },
                    },
                  },
                },
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "compositeRunBoxedExtractorOrQueryAction",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    nameGivenToResult: {
                      type: "string",
                    },
                    query: {
                      type: "object",
                      definition: {
                        actionType: {
                          type: "literal",
                          definition: "runBoxedExtractorOrQueryAction",
                        },
                        actionName: {
                          type: "literal",
                          definition: "runQuery",
                        },
                        endpoint: {
                          type: "literal",
                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                        },
                        deploymentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
                            },
                          },
                        },
                        payload: {
                          type: "object",
                          definition: {
                            applicationSection: {
                              type: "literal",
                              definition: "model",
                            },
                            query: {
                              type: "object",
                              definition: {
                                queryType: {
                                  type: "literal",
                                  definition: "boxedQueryWithExtractorCombinerTransformer",
                                },
                                deploymentUuid: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "literal",
                                      definition: "parameterReference",
                                    },
                                    interpolation: {
                                      type: "literal",
                                      optional: true,
                                      definition: "build",
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
                                    },
                                  },
                                },
                                pageParams: {
                                  type: "object",
                                  definition: {
                                    currentDeploymentUuid: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "string",
                                        },
                                        interpolation: {
                                          type: "string",
                                        },
                                        referenceName: {
                                          type: "string",
                                        },
                                      },
                                    },
                                  },
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
                                    entityDefinitions: {
                                      type: "object",
                                      definition: {
                                        extractorOrCombinerType: {
                                          type: "literal",
                                          definition: "extractorByEntityReturningObjectList",
                                        },
                                        applicationSection: {
                                          type: "literal",
                                          definition: "model",
                                        },
                                        parentName: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                                        },
                                        orderBy: {
                                          type: "object",
                                          optional: true,
                                          definition: {
                                            attributeName: {
                                              type: "string",
                                            },
                                            direction: {
                                              type: "enum",
                                              optional: true,
                                              definition: ["ASC", "DESC"],
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
                      },
                    },
                  },
                },
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "compositeRunBoxedExtractorOrQueryAction",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    nameGivenToResult: {
                      type: "string",
                    },
                    query: {
                      type: "object",
                      definition: {
                        actionType: {
                          type: "literal",
                          definition: "runBoxedExtractorOrQueryAction",
                        },
                        actionName: {
                          type: "literal",
                          definition: "runQuery",
                        },
                        endpoint: {
                          type: "literal",
                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                        },
                        deploymentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
                            },
                          },
                        },
                        payload: {
                          type: "object",
                          definition: {
                            applicationSection: {
                              type: "literal",
                              definition: "model",
                            },
                            query: {
                              type: "object",
                              definition: {
                                queryType: {
                                  type: "literal",
                                  definition: "boxedQueryWithExtractorCombinerTransformer",
                                },
                                deploymentUuid: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "literal",
                                      definition: "parameterReference",
                                    },
                                    interpolation: {
                                      type: "literal",
                                      optional: true,
                                      definition: "build",
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
                                    },
                                  },
                                },
                                pageParams: {
                                  type: "object",
                                  definition: {
                                    currentDeploymentUuid: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "string",
                                        },
                                        interpolation: {
                                          type: "string",
                                        },
                                        referenceName: {
                                          type: "string",
                                        },
                                      },
                                    },
                                  },
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
                                    entities: {
                                      type: "object",
                                      definition: {
                                        extractorOrCombinerType: {
                                          type: "literal",
                                          definition: "extractorByEntityReturningObjectList",
                                        },
                                        applicationSection: {
                                          type: "literal",
                                          definition: "model",
                                        },
                                        parentName: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                                        },
                                        orderBy: {
                                          type: "object",
                                          optional: true,
                                          definition: {
                                            attributeName: {
                                              type: "string",
                                            },
                                            direction: {
                                              type: "enum",
                                              optional: true,
                                              definition: ["ASC", "DESC"],
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
                      },
                    },
                  },
                },
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "compositeRunBoxedExtractorOrQueryAction",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    nameGivenToResult: {
                      type: "string",
                    },
                    query: {
                      type: "object",
                      definition: {
                        actionType: {
                          type: "literal",
                          definition: "runBoxedExtractorOrQueryAction",
                        },
                        actionName: {
                          type: "literal",
                          definition: "runQuery",
                        },
                        endpoint: {
                          type: "literal",
                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                        },
                        deploymentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
                            },
                          },
                        },
                        payload: {
                          type: "object",
                          definition: {
                            applicationSection: {
                              type: "literal",
                              definition: "model",
                            },
                            query: {
                              type: "object",
                              definition: {
                                queryType: {
                                  type: "literal",
                                  definition: "boxedQueryWithExtractorCombinerTransformer",
                                },
                                deploymentUuid: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "literal",
                                      definition: "parameterReference",
                                    },
                                    interpolation: {
                                      type: "literal",
                                      optional: true,
                                      definition: "build",
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
                                    },
                                  },
                                },
                                pageParams: {
                                  type: "object",
                                  definition: {
                                    currentDeploymentUuid: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "string",
                                        },
                                        interpolation: {
                                          type: "string",
                                        },
                                        referenceName: {
                                          type: "string",
                                        },
                                      },
                                    },
                                  },
                                },
                                runAsSql: {
                                  type: "boolean",
                                  optional: true,
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
                                    reports: {
                                      type: "object",
                                      definition: {
                                        extractorOrCombinerType: {
                                          type: "literal",
                                          definition: "extractorByEntityReturningObjectList",
                                        },
                                        applicationSection: {
                                          type: "literal",
                                          definition: "model",
                                        },
                                        parentName: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                                        },
                                        orderBy: {
                                          type: "object",
                                          optional: true,
                                          definition: {
                                            attributeName: {
                                              type: "string",
                                            },
                                            direction: {
                                              type: "enum",
                                              optional: true,
                                              definition: ["ASC", "DESC"],
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
                      },
                    },
                  },
                },
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "compositeRunBoxedQueryAction",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    nameGivenToResult: {
                      type: "string",
                    },
                    queryTemplate: {
                      type: "object",
                      definition: {
                        actionType: {
                          type: "literal",
                          definition: "runBoxedQueryAction",
                        },
                        actionName: {
                          type: "literal",
                          definition: "runQuery",
                        },
                        endpoint: {
                          type: "literal",
                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                        },
                        deploymentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
                            },
                          },
                        },
                        payload: {
                          type: "object",
                          definition: {
                            applicationSection: {
                              type: "literal",
                              definition: "model",
                            },
                            query: {
                              type: "object",
                              definition: {
                                queryType: {
                                  type: "literal",
                                  definition: "boxedQueryWithExtractorCombinerTransformer",
                                },
                                deploymentUuid: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "literal",
                                      definition: "parameterReference",
                                    },
                                    interpolation: {
                                      type: "literal",
                                      optional: true,
                                      definition: "build",
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
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
                                          type: "literal",
                                          definition: "model",
                                        },
                                        parentName: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                                          definition: "listPickElement",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          definition: "runtime",
                                        },
                                        applyTo: {
                                          type: "object",
                                          definition: {
                                            referenceType: {
                                              type: "literal",
                                              definition: "referencedTransformer",
                                            },
                                            reference: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "literal",
                                                  definition: "contextReference",
                                                },
                                                interpolation: {
                                                  type: "literal",
                                                  optional: true,
                                                  definition: "runtime",
                                                },
                                                referenceName: {
                                                  optional: true,
                                                  type: "string",
                                                },
                                              },
                                            },
                                          },
                                        },
                                        index: {
                                          type: "number",
                                        },
                                      },
                                    },
                                    menuItem: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "literal",
                                          definition: "freeObjectTemplate",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          definition: "runtime",
                                        },
                                        definition: {
                                          type: "object",
                                          definition: {
                                            reportUuid: {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "literal",
                                                  definition: "parameterReference",
                                                },
                                                interpolation: {
                                                  type: "literal",
                                                  optional: true,
                                                  definition: "build",
                                                },
                                                referenceName: {
                                                  optional: true,
                                                  type: "string",
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
                                                  type: "literal",
                                                  definition: "build",
                                                },
                                                definition: {
                                                  type: "string",
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
                                                  definition: "parameterReference",
                                                },
                                                interpolation: {
                                                  type: "literal",
                                                  optional: true,
                                                  definition: "build",
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
                                            },
                                            icon: {
                                              type: "string",
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
                                          type: "literal",
                                          definition: "runtime",
                                        },
                                        menuItemReference: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "contextReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "runtime",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        menuReference: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "contextReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "runtime",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        menuSectionItemInsertionIndex: {
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
                  },
                },
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "transactionalInstanceAction",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    instanceAction: {
                      type: "object",
                      definition: {
                        actionType: {
                          type: "literal",
                          definition: "updateInstance",
                        },
                        deploymentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
                            },
                          },
                        },
                        endpoint: {
                          type: "literal",
                          definition: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                        },
                        payload: {
                          type: "object",
                          definition: {
                            applicationSection: {
                              type: "literal",
                              definition: "model",
                            },
                            objects: {
                              type: "tuple",
                              tag: {
                                value: {
                                  id: 2,
                                  defaultLabel: "Entity Instances to update",
                                  editable: true,
                                },
                              },
                              definition: [
                                {
                                  type: "object",
                                  definition: {
                                    parentName: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "literal",
                                          definition: "parameterReference",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          optional: true,
                                          definition: "build",
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
                                    },
                                    parentUuid: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "literal",
                                          definition: "parameterReference",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          optional: true,
                                          definition: "build",
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
                                    },
                                    applicationSection: {
                                      type: "literal",
                                      definition: "model",
                                    },
                                    instances: {
                                      type: "tuple",
                                      definition: [
                                        {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "contextReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "runtime",
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
                    },
                  },
                },
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "commit",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    endpoint: {
                      type: "literal",
                      definition: "7947ae40-eb34-4149-887b-15a9021e714e",
                    },
                    deploymentUuid: {
                      type: "object",
                      definition: {
                        transformerType: {
                          type: "literal",
                          definition: "parameterReference",
                        },
                        interpolation: {
                          type: "literal",
                          optional: true,
                          definition: "build",
                        },
                        referenceName: {
                          optional: true,
                          type: "string",
                        },
                      },
                    },
                  },
                },
                {
                  type: "object",
                  definition: {
                    actionType: {
                      type: "literal",
                      definition: "compositeRunBoxedQueryAction",
                    },
                    actionLabel: {
                      type: "string",
                      optional: true,
                    },
                    nameGivenToResult: {
                      type: "string",
                    },
                    queryTemplate: {
                      type: "object",
                      definition: {
                        actionType: {
                          type: "literal",
                          definition: "runBoxedQueryAction",
                        },
                        actionName: {
                          type: "literal",
                          definition: "runQuery",
                        },
                        endpoint: {
                          type: "literal",
                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                        },
                        deploymentUuid: {
                          type: "object",
                          definition: {
                            transformerType: {
                              type: "literal",
                              definition: "parameterReference",
                            },
                            interpolation: {
                              type: "literal",
                              optional: true,
                              definition: "build",
                            },
                            referenceName: {
                              optional: true,
                              type: "string",
                            },
                          },
                        },
                        payload: {
                          type: "object",
                          definition: {
                            applicationSection: {
                              type: "literal",
                              definition: "model",
                            },
                            query: {
                              type: "object",
                              definition: {
                                queryType: {
                                  type: "literal",
                                  definition: "boxedQueryWithExtractorCombinerTransformer",
                                },
                                deploymentUuid: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "literal",
                                      definition: "parameterReference",
                                    },
                                    interpolation: {
                                      type: "literal",
                                      optional: true,
                                      definition: "build",
                                    },
                                    referenceName: {
                                      optional: true,
                                      type: "string",
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
                                          type: "literal",
                                          definition: "model",
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
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
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
                  },
                },
              ],
            },
          },
        },
      },
      // ##########################################################################################
      test830: {
        testSchema: entityDefinitionTest.jzodSchema as JzodElement,
        testValueObject: test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
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
                  id: 1,
                  defaultLabel: "Uuid",
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
                  id: 1,
                  defaultLabel: "parentUuid",
                  editable: false,
                },
              },
            },
            name: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Name",
                  editable: true,
                },
              },
            },
            selfApplication: {
              type: "uuid",
              tag: {
                value: {
                  id: 9,
                  defaultLabel: "SelfApplication",
                  targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                  editable: false,
                },
              },
            },
            branch: {
              type: "uuid",
              tag: {
                value: {
                  id: 10,
                  defaultLabel: "Branch",
                  description: "The Branch of the SelfApplication",
                  editable: false,
                },
              },
            },
            description: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Name",
                  editable: true,
                },
              },
            },
            definition: {
              type: "object",
              definition: {
                testCompositeActions: {
                  type: "object",
                  optional: true,
                  definition: {
                    "create new Entity and reports from spreadsheet": {
                      type: "object",
                      definition: {
                        testType: {
                          type: "literal",
                          definition: "testBuildPlusRuntimeCompositeAction",
                        },
                        testLabel: {
                          type: "string",
                        },
                        compositeAction: {
                          type: "object",
                          definition: {
                            actionType: {
                              type: "literal",
                              definition: "compositeAction",
                            },
                            actionLabel: {
                              type: "string",
                              optional: true,
                            },
                            actionName: {
                              type: "literal",
                              definition: "sequence",
                            },
                            templates: {
                              type: "object",
                              optional: true,
                              definition: {
                                createEntity_newEntity: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "string",
                                    },
                                    interpolation: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        uuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referencePath: {
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
                                        },
                                        selfApplication: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        description: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        name: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                createEntity_newEntityDefinition: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "string",
                                    },
                                    interpolation: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        name: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        uuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        parentName: {
                                          type: "string",
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referencePath: {
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
                                        },
                                        entityUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referencePath: {
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
                                        },
                                        conceptLevel: {
                                          type: "string",
                                        },
                                        defaultInstanceDetailsReportUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        jzodSchema: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                newEntityListReport: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "string",
                                    },
                                    interpolation: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        uuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        selfApplication: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        parentName: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            value: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        conceptLevel: {
                                          type: "string",
                                        },
                                        name: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        defaultLabel: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        type: {
                                          type: "string",
                                        },
                                        definition: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "object",
                                              definition: {
                                                extractors: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    definition: {
                                                      type: "object",
                                                      definition: {
                                                        instanceList: {
                                                          type: "object",
                                                          definition: {
                                                            extractorOrCombinerType: {
                                                              type: "string",
                                                            },
                                                            parentName: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "string",
                                                                },
                                                                interpolation: {
                                                                  type: "string",
                                                                },
                                                                referenceName: {
                                                                  type: "string",
                                                                },
                                                              },
                                                            },
                                                            parentUuid: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "string",
                                                                },
                                                                interpolation: {
                                                                  type: "string",
                                                                },
                                                                definition: {
                                                                  type: "string",
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                                section: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    definition: {
                                                      type: "object",
                                                      definition: {
                                                        type: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "string",
                                                            },
                                                            interpolation: {
                                                              type: "string",
                                                            },
                                                            value: {
                                                              type: "string",
                                                            },
                                                          },
                                                        },
                                                        definition: {
                                                          type: "object",
                                                          definition: {
                                                            label: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "string",
                                                                },
                                                                interpolation: {
                                                                  type: "string",
                                                                },
                                                                definition: {
                                                                  type: "string",
                                                                },
                                                              },
                                                            },
                                                            parentUuid: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "string",
                                                                },
                                                                interpolation: {
                                                                  type: "string",
                                                                },
                                                                definition: {
                                                                  type: "string",
                                                                },
                                                              },
                                                            },
                                                            fetchedDataReference: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "string",
                                                                },
                                                                interpolation: {
                                                                  type: "string",
                                                                },
                                                                value: {
                                                                  type: "string",
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
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                newEntityDetailsReport: {
                                  type: "object",
                                  definition: {
                                    transformerType: {
                                      type: "string",
                                    },
                                    interpolation: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        uuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        selfApplication: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            referenceName: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        parentName: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        parentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        conceptLevel: {
                                          type: "string",
                                        },
                                        name: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        defaultLabel: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "string",
                                            },
                                            interpolation: {
                                              type: "string",
                                            },
                                            definition: {
                                              type: "string",
                                            },
                                          },
                                        },
                                        definition: {
                                          type: "object",
                                          definition: {
                                            extractorTemplates: {
                                              type: "object",
                                              definition: {
                                                elementToDisplay: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    value: {
                                                      type: "object",
                                                      definition: {
                                                        extractorTemplateType: {
                                                          type: "string",
                                                        },
                                                        parentName: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "string",
                                                            },
                                                            interpolation: {
                                                              type: "string",
                                                            },
                                                            referenceName: {
                                                              type: "string",
                                                            },
                                                          },
                                                        },
                                                        parentUuid: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "string",
                                                            },
                                                            interpolation: {
                                                              type: "string",
                                                            },
                                                            definition: {
                                                              type: "string",
                                                            },
                                                          },
                                                        },
                                                        instanceUuid: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "string",
                                                            },
                                                            interpolation: {
                                                              type: "string",
                                                            },
                                                            value: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "string",
                                                                },
                                                                interpolation: {
                                                                  type: "string",
                                                                },
                                                                referenceName: {
                                                                  type: "string",
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
                                            section: {
                                              type: "object",
                                              definition: {
                                                type: {
                                                  type: "string",
                                                },
                                                definition: {
                                                  type: "tuple",
                                                  definition: [
                                                    {
                                                      type: "object",
                                                      definition: {
                                                        type: {
                                                          type: "string",
                                                        },
                                                        definition: {
                                                          type: "object",
                                                          definition: {
                                                            label: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "string",
                                                                },
                                                                interpolation: {
                                                                  type: "string",
                                                                },
                                                                definition: {
                                                                  type: "string",
                                                                },
                                                              },
                                                            },
                                                            parentUuid: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "string",
                                                                },
                                                                interpolation: {
                                                                  type: "string",
                                                                },
                                                                definition: {
                                                                  type: "string",
                                                                },
                                                              },
                                                            },
                                                            fetchedDataReference: {
                                                              type: "string",
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
                                      },
                                    },
                                  },
                                },
                              },
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
                                          definition: "parameterReference",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          optional: true,
                                          definition: "build",
                                        },
                                        referenceName: {
                                          optional: true,
                                          type: "string",
                                        },
                                      },
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
                                                      definition: "parameterReference",
                                                    },
                                                    interpolation: {
                                                      type: "literal",
                                                      optional: true,
                                                      definition: "build",
                                                    },
                                                    referenceName: {
                                                      optional: true,
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                entityDefinition: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "literal",
                                                      definition: "parameterReference",
                                                    },
                                                    interpolation: {
                                                      type: "literal",
                                                      optional: true,
                                                      definition: "build",
                                                    },
                                                    referenceName: {
                                                      optional: true,
                                                      type: "string",
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
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "transactionalInstanceAction",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    instanceAction: {
                                      type: "object",
                                      definition: {
                                        actionType: {
                                          type: "literal",
                                          definition: "createInstance",
                                        },
                                        deploymentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        endpoint: {
                                          type: "literal",
                                          definition: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                                        },
                                        payload: {
                                          type: "object",
                                          definition: {
                                            applicationSection: {
                                              type: "literal",
                                              definition: "model",
                                            },
                                            objects: {
                                              type: "tuple",
                                              tag: {
                                                value: {
                                                  id: 2,
                                                  defaultLabel: "Entity Instances to create",
                                                  editable: true,
                                                },
                                              },
                                              definition: [
                                                {
                                                  type: "object",
                                                  definition: {
                                                    parentName: {
                                                      type: "object",
                                                      definition: {
                                                        transformerType: {
                                                          type: "literal",
                                                          definition: "parameterReference",
                                                        },
                                                        interpolation: {
                                                          type: "literal",
                                                          optional: true,
                                                          definition: "build",
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
                                                    },
                                                    parentUuid: {
                                                      type: "object",
                                                      definition: {
                                                        transformerType: {
                                                          type: "literal",
                                                          definition: "parameterReference",
                                                        },
                                                        interpolation: {
                                                          type: "literal",
                                                          optional: true,
                                                          definition: "build",
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
                                                    },
                                                    applicationSection: {
                                                      type: "literal",
                                                      definition: "model",
                                                    },
                                                    instances: {
                                                      type: "tuple",
                                                      definition: [
                                                        {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
                                                            },
                                                            referenceName: {
                                                              optional: true,
                                                              type: "string",
                                                            },
                                                          },
                                                        },
                                                        {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
                                                            },
                                                            referenceName: {
                                                              optional: true,
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
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "commit",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    endpoint: {
                                      type: "literal",
                                      definition: "7947ae40-eb34-4149-887b-15a9021e714e",
                                    },
                                    deploymentUuid: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "literal",
                                          definition: "parameterReference",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          optional: true,
                                          definition: "build",
                                        },
                                        referenceName: {
                                          optional: true,
                                          type: "string",
                                        },
                                      },
                                    },
                                  },
                                },
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "compositeRunBoxedExtractorOrQueryAction",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    nameGivenToResult: {
                                      type: "string",
                                    },
                                    query: {
                                      type: "object",
                                      definition: {
                                        actionType: {
                                          type: "literal",
                                          definition: "runBoxedExtractorOrQueryAction",
                                        },
                                        actionName: {
                                          type: "literal",
                                          definition: "runQuery",
                                        },
                                        endpoint: {
                                          type: "literal",
                                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                                        },
                                        deploymentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        payload: {
                                          type: "object",
                                          definition: {
                                            applicationSection: {
                                              type: "literal",
                                              definition: "model",
                                            },
                                            query: {
                                              type: "object",
                                              definition: {
                                                queryType: {
                                                  type: "literal",
                                                  definition:
                                                    "boxedQueryWithExtractorCombinerTransformer",
                                                },
                                                deploymentUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "literal",
                                                      definition: "parameterReference",
                                                    },
                                                    interpolation: {
                                                      type: "literal",
                                                      optional: true,
                                                      definition: "build",
                                                    },
                                                    referenceName: {
                                                      optional: true,
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                pageParams: {
                                                  type: "object",
                                                  definition: {
                                                    currentDeploymentUuid: {
                                                      type: "object",
                                                      definition: {
                                                        transformerType: {
                                                          type: "string",
                                                        },
                                                        interpolation: {
                                                          type: "string",
                                                        },
                                                        referenceName: {
                                                          type: "string",
                                                        },
                                                      },
                                                    },
                                                  },
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
                                                    entityDefinitions: {
                                                      type: "object",
                                                      definition: {
                                                        extractorOrCombinerType: {
                                                          type: "literal",
                                                          definition:
                                                            "extractorByEntityReturningObjectList",
                                                        },
                                                        applicationSection: {
                                                          type: "literal",
                                                          definition: "model",
                                                        },
                                                        parentName: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                                        },
                                                        parentUuid: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                                        },
                                                        orderBy: {
                                                          type: "object",
                                                          optional: true,
                                                          definition: {
                                                            attributeName: {
                                                              type: "string",
                                                            },
                                                            direction: {
                                                              type: "enum",
                                                              optional: true,
                                                              definition: ["ASC", "DESC"],
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
                                      },
                                    },
                                  },
                                },
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "compositeRunBoxedExtractorOrQueryAction",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    nameGivenToResult: {
                                      type: "string",
                                    },
                                    query: {
                                      type: "object",
                                      definition: {
                                        actionType: {
                                          type: "literal",
                                          definition: "runBoxedExtractorOrQueryAction",
                                        },
                                        actionName: {
                                          type: "literal",
                                          definition: "runQuery",
                                        },
                                        endpoint: {
                                          type: "literal",
                                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                                        },
                                        deploymentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        payload: {
                                          type: "object",
                                          definition: {
                                            applicationSection: {
                                              type: "literal",
                                              definition: "model",
                                            },
                                            query: {
                                              type: "object",
                                              definition: {
                                                queryType: {
                                                  type: "literal",
                                                  definition:
                                                    "boxedQueryWithExtractorCombinerTransformer",
                                                },
                                                deploymentUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "literal",
                                                      definition: "parameterReference",
                                                    },
                                                    interpolation: {
                                                      type: "literal",
                                                      optional: true,
                                                      definition: "build",
                                                    },
                                                    referenceName: {
                                                      optional: true,
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                pageParams: {
                                                  type: "object",
                                                  definition: {
                                                    currentDeploymentUuid: {
                                                      type: "object",
                                                      definition: {
                                                        transformerType: {
                                                          type: "string",
                                                        },
                                                        interpolation: {
                                                          type: "string",
                                                        },
                                                        referenceName: {
                                                          type: "string",
                                                        },
                                                      },
                                                    },
                                                  },
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
                                                    entities: {
                                                      type: "object",
                                                      definition: {
                                                        extractorOrCombinerType: {
                                                          type: "literal",
                                                          definition:
                                                            "extractorByEntityReturningObjectList",
                                                        },
                                                        applicationSection: {
                                                          type: "literal",
                                                          definition: "model",
                                                        },
                                                        parentName: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                                        },
                                                        parentUuid: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                                        },
                                                        orderBy: {
                                                          type: "object",
                                                          optional: true,
                                                          definition: {
                                                            attributeName: {
                                                              type: "string",
                                                            },
                                                            direction: {
                                                              type: "enum",
                                                              optional: true,
                                                              definition: ["ASC", "DESC"],
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
                                      },
                                    },
                                  },
                                },
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "compositeRunBoxedExtractorOrQueryAction",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    nameGivenToResult: {
                                      type: "string",
                                    },
                                    query: {
                                      type: "object",
                                      definition: {
                                        actionType: {
                                          type: "literal",
                                          definition: "runBoxedExtractorOrQueryAction",
                                        },
                                        actionName: {
                                          type: "literal",
                                          definition: "runQuery",
                                        },
                                        endpoint: {
                                          type: "literal",
                                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                                        },
                                        deploymentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        payload: {
                                          type: "object",
                                          definition: {
                                            applicationSection: {
                                              type: "literal",
                                              definition: "model",
                                            },
                                            query: {
                                              type: "object",
                                              definition: {
                                                queryType: {
                                                  type: "literal",
                                                  definition:
                                                    "boxedQueryWithExtractorCombinerTransformer",
                                                },
                                                deploymentUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "literal",
                                                      definition: "parameterReference",
                                                    },
                                                    interpolation: {
                                                      type: "literal",
                                                      optional: true,
                                                      definition: "build",
                                                    },
                                                    referenceName: {
                                                      optional: true,
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                pageParams: {
                                                  type: "object",
                                                  definition: {
                                                    currentDeploymentUuid: {
                                                      type: "object",
                                                      definition: {
                                                        transformerType: {
                                                          type: "string",
                                                        },
                                                        interpolation: {
                                                          type: "string",
                                                        },
                                                        referenceName: {
                                                          type: "string",
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                                runAsSql: {
                                                  type: "boolean",
                                                  optional: true,
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
                                                    reports: {
                                                      type: "object",
                                                      definition: {
                                                        extractorOrCombinerType: {
                                                          type: "literal",
                                                          definition:
                                                            "extractorByEntityReturningObjectList",
                                                        },
                                                        applicationSection: {
                                                          type: "literal",
                                                          definition: "model",
                                                        },
                                                        parentName: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                                        },
                                                        parentUuid: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                                        },
                                                        orderBy: {
                                                          type: "object",
                                                          optional: true,
                                                          definition: {
                                                            attributeName: {
                                                              type: "string",
                                                            },
                                                            direction: {
                                                              type: "enum",
                                                              optional: true,
                                                              definition: ["ASC", "DESC"],
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
                                      },
                                    },
                                  },
                                },
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "compositeRunBoxedQueryAction",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    nameGivenToResult: {
                                      type: "string",
                                    },
                                    queryTemplate: {
                                      type: "object",
                                      definition: {
                                        actionType: {
                                          type: "literal",
                                          definition: "runBoxedQueryAction",
                                        },
                                        actionName: {
                                          type: "literal",
                                          definition: "runQuery",
                                        },
                                        endpoint: {
                                          type: "literal",
                                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                                        },
                                        deploymentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        payload: {
                                          type: "object",
                                          definition: {
                                            applicationSection: {
                                              type: "literal",
                                              definition: "model",
                                            },
                                            query: {
                                              type: "object",
                                              definition: {
                                                queryType: {
                                                  type: "literal",
                                                  definition:
                                                    "boxedQueryWithExtractorCombinerTransformer",
                                                },
                                                deploymentUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "literal",
                                                      definition: "parameterReference",
                                                    },
                                                    interpolation: {
                                                      type: "literal",
                                                      optional: true,
                                                      definition: "build",
                                                    },
                                                    referenceName: {
                                                      optional: true,
                                                      type: "string",
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
                                                          definition:
                                                            "extractorByEntityReturningObjectList",
                                                        },
                                                        applicationSection: {
                                                          type: "literal",
                                                          definition: "model",
                                                        },
                                                        parentName: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                                        },
                                                        parentUuid: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                                          definition: "listPickElement",
                                                        },
                                                        interpolation: {
                                                          type: "literal",
                                                          definition: "runtime",
                                                        },
                                                        applyTo: {
                                                          type: "object",
                                                          definition: {
                                                            referenceType: {
                                                              type: "literal",
                                                              definition: "referencedTransformer",
                                                            },
                                                            reference: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "literal",
                                                                  definition: "contextReference",
                                                                },
                                                                interpolation: {
                                                                  type: "literal",
                                                                  optional: true,
                                                                  definition: "runtime",
                                                                },
                                                                referenceName: {
                                                                  optional: true,
                                                                  type: "string",
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                        index: {
                                                          type: "number",
                                                        },
                                                      },
                                                    },
                                                    menuItem: {
                                                      type: "object",
                                                      definition: {
                                                        transformerType: {
                                                          type: "literal",
                                                          definition: "freeObjectTemplate",
                                                        },
                                                        interpolation: {
                                                          type: "literal",
                                                          definition: "runtime",
                                                        },
                                                        definition: {
                                                          type: "object",
                                                          definition: {
                                                            reportUuid: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "literal",
                                                                  definition: "parameterReference",
                                                                },
                                                                interpolation: {
                                                                  type: "literal",
                                                                  optional: true,
                                                                  definition: "build",
                                                                },
                                                                referenceName: {
                                                                  optional: true,
                                                                  type: "string",
                                                                },
                                                              },
                                                            },
                                                            label: {
                                                              type: "object",
                                                              definition: {
                                                                transformerType: {
                                                                  type: "literal",
                                                                  definition:
                                                                    "mustacheStringTemplate",
                                                                },
                                                                interpolation: {
                                                                  type: "literal",
                                                                  definition: "build",
                                                                },
                                                                definition: {
                                                                  type: "string",
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
                                                                  definition: "parameterReference",
                                                                },
                                                                interpolation: {
                                                                  type: "literal",
                                                                  optional: true,
                                                                  definition: "build",
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
                                                            },
                                                            icon: {
                                                              type: "string",
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
                                                          type: "literal",
                                                          definition: "runtime",
                                                        },
                                                        menuItemReference: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "contextReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "runtime",
                                                            },
                                                            referenceName: {
                                                              optional: true,
                                                              type: "string",
                                                            },
                                                          },
                                                        },
                                                        menuReference: {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "contextReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "runtime",
                                                            },
                                                            referenceName: {
                                                              optional: true,
                                                              type: "string",
                                                            },
                                                          },
                                                        },
                                                        menuSectionItemInsertionIndex: {
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
                                  },
                                },
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "transactionalInstanceAction",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    instanceAction: {
                                      type: "object",
                                      definition: {
                                        actionType: {
                                          type: "literal",
                                          definition: "updateInstance",
                                        },
                                        deploymentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        endpoint: {
                                          type: "literal",
                                          definition: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                                        },
                                        payload: {
                                          type: "object",
                                          definition: {
                                            applicationSection: {
                                              type: "literal",
                                              definition: "model",
                                            },
                                            objects: {
                                              type: "tuple",
                                              tag: {
                                                value: {
                                                  id: 2,
                                                  defaultLabel: "Entity Instances to update",
                                                  editable: true,
                                                },
                                              },
                                              definition: [
                                                {
                                                  type: "object",
                                                  definition: {
                                                    parentName: {
                                                      type: "object",
                                                      definition: {
                                                        transformerType: {
                                                          type: "literal",
                                                          definition: "parameterReference",
                                                        },
                                                        interpolation: {
                                                          type: "literal",
                                                          optional: true,
                                                          definition: "build",
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
                                                    },
                                                    parentUuid: {
                                                      type: "object",
                                                      definition: {
                                                        transformerType: {
                                                          type: "literal",
                                                          definition: "parameterReference",
                                                        },
                                                        interpolation: {
                                                          type: "literal",
                                                          optional: true,
                                                          definition: "build",
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
                                                    },
                                                    applicationSection: {
                                                      type: "literal",
                                                      definition: "model",
                                                    },
                                                    instances: {
                                                      type: "tuple",
                                                      definition: [
                                                        {
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "contextReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "runtime",
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
                                    },
                                  },
                                },
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "commit",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    endpoint: {
                                      type: "literal",
                                      definition: "7947ae40-eb34-4149-887b-15a9021e714e",
                                    },
                                    deploymentUuid: {
                                      type: "object",
                                      definition: {
                                        transformerType: {
                                          type: "literal",
                                          definition: "parameterReference",
                                        },
                                        interpolation: {
                                          type: "literal",
                                          optional: true,
                                          definition: "build",
                                        },
                                        referenceName: {
                                          optional: true,
                                          type: "string",
                                        },
                                      },
                                    },
                                  },
                                },
                                {
                                  type: "object",
                                  definition: {
                                    actionType: {
                                      type: "literal",
                                      definition: "compositeRunBoxedQueryAction",
                                    },
                                    actionLabel: {
                                      type: "string",
                                      optional: true,
                                    },
                                    nameGivenToResult: {
                                      type: "string",
                                    },
                                    queryTemplate: {
                                      type: "object",
                                      definition: {
                                        actionType: {
                                          type: "literal",
                                          definition: "runBoxedQueryAction",
                                        },
                                        actionName: {
                                          type: "literal",
                                          definition: "runQuery",
                                        },
                                        endpoint: {
                                          type: "literal",
                                          definition: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                                        },
                                        deploymentUuid: {
                                          type: "object",
                                          definition: {
                                            transformerType: {
                                              type: "literal",
                                              definition: "parameterReference",
                                            },
                                            interpolation: {
                                              type: "literal",
                                              optional: true,
                                              definition: "build",
                                            },
                                            referenceName: {
                                              optional: true,
                                              type: "string",
                                            },
                                          },
                                        },
                                        payload: {
                                          type: "object",
                                          definition: {
                                            applicationSection: {
                                              type: "literal",
                                              definition: "model",
                                            },
                                            query: {
                                              type: "object",
                                              definition: {
                                                queryType: {
                                                  type: "literal",
                                                  definition:
                                                    "boxedQueryWithExtractorCombinerTransformer",
                                                },
                                                deploymentUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "literal",
                                                      definition: "parameterReference",
                                                    },
                                                    interpolation: {
                                                      type: "literal",
                                                      optional: true,
                                                      definition: "build",
                                                    },
                                                    referenceName: {
                                                      optional: true,
                                                      type: "string",
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
                                                          definition:
                                                            "extractorByEntityReturningObjectList",
                                                        },
                                                        applicationSection: {
                                                          type: "literal",
                                                          definition: "model",
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
                                                          type: "object",
                                                          definition: {
                                                            transformerType: {
                                                              type: "literal",
                                                              definition: "parameterReference",
                                                            },
                                                            interpolation: {
                                                              type: "literal",
                                                              optional: true,
                                                              definition: "build",
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
                                  },
                                },
                              ],
                            },
                          },
                        },
                        testCompositeActionAssertions: {
                          type: "tuple",
                          definition: [
                            {
                              type: "object",
                              definition: {
                                actionType: {
                                  type: "literal",
                                  definition: "compositeRunTestAssertion",
                                },
                                actionLabel: {
                                  type: "string",
                                  optional: true,
                                },
                                nameGivenToResult: {
                                  type: "string",
                                },
                                testAssertion: {
                                  type: "object",
                                  definition: {
                                    testType: {
                                      type: "literal",
                                      definition: "testAssertion",
                                    },
                                    testLabel: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        resultAccessPath: {
                                          type: "tuple",
                                          optional: true,
                                          definition: [
                                            {
                                              type: "string",
                                            },
                                            {
                                              type: "string",
                                            },
                                          ],
                                        },
                                        ignoreAttributes: {
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
                                        },
                                        expectedValue: {
                                          type: "tuple",
                                          definition: [
                                            {
                                              type: "object",
                                              definition: {
                                                uuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referenceName: {
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                parentUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referencePath: {
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
                                                },
                                                selfApplication: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referenceName: {
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                description: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referenceName: {
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                name: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referenceName: {
                                                      type: "string",
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
                              },
                            },
                            {
                              type: "object",
                              definition: {
                                actionType: {
                                  type: "literal",
                                  definition: "compositeRunTestAssertion",
                                },
                                actionLabel: {
                                  type: "string",
                                  optional: true,
                                },
                                nameGivenToResult: {
                                  type: "string",
                                },
                                testAssertion: {
                                  type: "object",
                                  definition: {
                                    testType: {
                                      type: "literal",
                                      definition: "testAssertion",
                                    },
                                    testLabel: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        resultAccessPath: {
                                          type: "tuple",
                                          optional: true,
                                          definition: [
                                            {
                                              type: "string",
                                            },
                                            {
                                              type: "string",
                                            },
                                          ],
                                        },
                                        ignoreAttributes: {
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
                                        expectedValue: {
                                          type: "tuple",
                                          definition: [
                                            {
                                              type: "object",
                                              definition: {
                                                name: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referenceName: {
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                uuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referenceName: {
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                parentName: {
                                                  type: "string",
                                                },
                                                parentUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referencePath: {
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
                                                },
                                                entityUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referencePath: {
                                                      type: "tuple",
                                                      definition: [
                                                        {
                                                          type: "string",
                                                        },
                                                      ],
                                                    },
                                                  },
                                                },
                                                conceptLevel: {
                                                  type: "string",
                                                },
                                                defaultInstanceDetailsReportUuid: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referenceName: {
                                                      type: "string",
                                                    },
                                                  },
                                                },
                                                jzodSchema: {
                                                  type: "object",
                                                  definition: {
                                                    transformerType: {
                                                      type: "string",
                                                    },
                                                    interpolation: {
                                                      type: "string",
                                                    },
                                                    referenceName: {
                                                      type: "string",
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
                              },
                            },
                            {
                              type: "object",
                              definition: {
                                actionType: {
                                  type: "literal",
                                  definition: "compositeRunTestAssertion",
                                },
                                actionLabel: {
                                  type: "string",
                                  optional: true,
                                },
                                nameGivenToResult: {
                                  type: "string",
                                },
                                testAssertion: {
                                  type: "object",
                                  definition: {
                                    testType: {
                                      type: "literal",
                                      definition: "testAssertion",
                                    },
                                    testLabel: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        resultAccessPath: {
                                          type: "tuple",
                                          optional: true,
                                          definition: [
                                            {
                                              type: "string",
                                            },
                                            {
                                              type: "string",
                                            },
                                          ],
                                        },
                                        ignoreAttributes: {
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
                                          ],
                                        },
                                        expectedValue: {
                                          type: "tuple",
                                          definition: [
                                            {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                referenceName: {
                                                  type: "string",
                                                },
                                              },
                                            },
                                            {
                                              type: "object",
                                              definition: {
                                                transformerType: {
                                                  type: "string",
                                                },
                                                interpolation: {
                                                  type: "string",
                                                },
                                                referenceName: {
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
                            },
                            {
                              type: "object",
                              definition: {
                                actionType: {
                                  type: "literal",
                                  definition: "compositeRunTestAssertion",
                                },
                                actionLabel: {
                                  type: "string",
                                  optional: true,
                                },
                                nameGivenToResult: {
                                  type: "string",
                                },
                                testAssertion: {
                                  type: "object",
                                  definition: {
                                    testType: {
                                      type: "literal",
                                      definition: "testAssertion",
                                    },
                                    testLabel: {
                                      type: "string",
                                    },
                                    definition: {
                                      type: "object",
                                      definition: {
                                        resultAccessPath: {
                                          type: "tuple",
                                          optional: true,
                                          definition: [
                                            {
                                              type: "string",
                                            },
                                            {
                                              type: "string",
                                            },
                                          ],
                                        },
                                        ignoreAttributes: {
                                          type: "tuple",
                                          optional: true,
                                          definition: [
                                            {
                                              type: "string",
                                            },
                                          ],
                                        },
                                        expectedValue: {
                                          type: "tuple",
                                          definition: [
                                            {
                                              type: "object",
                                              definition: {
                                                uuid: {
                                                  type: "string",
                                                },
                                                parentName: {
                                                  type: "string",
                                                },
                                                parentUuid: {
                                                  type: "string",
                                                },
                                                parentDefinitionVersionUuid: {
                                                  type: "null",
                                                },
                                                name: {
                                                  type: "string",
                                                },
                                                defaultLabel: {
                                                  type: "string",
                                                },
                                                description: {
                                                  type: "string",
                                                },
                                                definition: {
                                                  type: "object",
                                                  definition: {
                                                    menuType: {
                                                      type: "string",
                                                    },
                                                    definition: {
                                                      type: "tuple",
                                                      definition: [
                                                        {
                                                          type: "object",
                                                          definition: {
                                                            items: {
                                                              type: "tuple",
                                                              definition: [
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                    label: {
                                                                      type: "string",
                                                                    },
                                                                    section: {
                                                                      type: "string",
                                                                    },
                                                                    reportUuid: {
                                                                      type: "string",
                                                                    },
                                                                    selfApplication: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                    label: {
                                                                      type: "string",
                                                                    },
                                                                    section: {
                                                                      type: "string",
                                                                    },
                                                                    reportUuid: {
                                                                      type: "string",
                                                                    },
                                                                    selfApplication: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                    label: {
                                                                      type: "string",
                                                                    },
                                                                    section: {
                                                                      type: "string",
                                                                    },
                                                                    reportUuid: {
                                                                      type: "string",
                                                                    },
                                                                    selfApplication: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                    label: {
                                                                      type: "string",
                                                                    },
                                                                    section: {
                                                                      type: "string",
                                                                    },
                                                                    reportUuid: {
                                                                      type: "string",
                                                                    },
                                                                    selfApplication: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                    label: {
                                                                      type: "string",
                                                                    },
                                                                    section: {
                                                                      type: "string",
                                                                    },
                                                                    reportUuid: {
                                                                      type: "string",
                                                                    },
                                                                    selfApplication: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                    label: {
                                                                      type: "string",
                                                                    },
                                                                    section: {
                                                                      type: "string",
                                                                    },
                                                                    reportUuid: {
                                                                      type: "string",
                                                                    },
                                                                    selfApplication: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                    label: {
                                                                      type: "string",
                                                                    },
                                                                    section: {
                                                                      type: "string",
                                                                    },
                                                                    reportUuid: {
                                                                      type: "string",
                                                                    },
                                                                    selfApplication: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                    label: {
                                                                      type: "string",
                                                                    },
                                                                    section: {
                                                                      type: "string",
                                                                    },
                                                                    reportUuid: {
                                                                      type: "string",
                                                                    },
                                                                    selfApplication: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                                {
                                                                  type: "object",
                                                                  definition: {
                                                                    reportUuid: {
                                                                      type: "object",
                                                                      definition: {
                                                                        transformerType: {
                                                                          type: "string",
                                                                        },
                                                                        interpolation: {
                                                                          type: "string",
                                                                        },
                                                                        referenceName: {
                                                                          type: "string",
                                                                        },
                                                                      },
                                                                    },
                                                                    label: {
                                                                      type: "object",
                                                                      definition: {
                                                                        transformerType: {
                                                                          type: "string",
                                                                        },
                                                                        interpolation: {
                                                                          type: "string",
                                                                        },
                                                                        definition: {
                                                                          type: "string",
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
                                                                          type: "string",
                                                                        },
                                                                        interpolation: {
                                                                          type: "string",
                                                                        },
                                                                        referencePath: {
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
                                                                    },
                                                                    icon: {
                                                                      type: "string",
                                                                    },
                                                                  },
                                                                },
                                                              ],
                                                            },
                                                            label: {
                                                              type: "string",
                                                            },
                                                            title: {
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
                                          ],
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
              },
            },
          },
        },
      },
      // // ##########################################################################################
      // // ########################### BOOK ENTITY ######################################
      // // ##########################################################################################
      // // Book entity
      // test900: {
      //   testSchema: {
      //     type: "object",
      //     definition: {
      //       uuid: {
      //         type: "string",
      //         validations: [
      //           {
      //             type: "uuid",
      //           },
      //         ],
      //         tag: {
      //           value: {
      //             id: 1,
      //             defaultLabel: "Uuid",
      //             editable: false,
      //           },
      //         },
      //       },
      //       parentName: {
      //         type: "string",
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 2,
      //             defaultLabel: "Entity Name",
      //             editable: false,
      //           },
      //         },
      //       },
      //       parentUuid: {
      //         type: "string",
      //         validations: [
      //           {
      //             type: "uuid",
      //           },
      //         ],
      //         tag: {
      //           value: {
      //             id: 3,
      //             defaultLabel: "Entity Uuid",
      //             editable: false,
      //           },
      //         },
      //       },
      //       name: {
      //         type: "string",
      //         tag: {
      //           value: {
      //             id: 4,
      //             defaultLabel: "Name",
      //             editable: true,
      //           },
      //         },
      //       },
      //       author: {
      //         type: "string",
      //         validations: [
      //           {
      //             type: "uuid",
      //           },
      //         ],
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 5,
      //             defaultLabel: "Author",
      //             targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
      //             editable: true,
      //           },
      //         },
      //       },
      //       publisher: {
      //         type: "string",
      //         validations: [
      //           {
      //             type: "uuid",
      //           },
      //         ],
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 5,
      //             defaultLabel: "Publisher",
      //             targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
      //             editable: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      //   expectedResolvedSchema: {
      //     type: "object",
      //     definition: {
      //       uuid: {
      //         type: "string",
      //         validations: [
      //           {
      //             type: "uuid",
      //           },
      //         ],
      //         tag: {
      //           value: {
      //             id: 1,
      //             defaultLabel: "Uuid",
      //             editable: false,
      //           },
      //         },
      //       },
      //       parentName: {
      //         type: "string",
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 2,
      //             defaultLabel: "Entity Name",
      //             editable: false,
      //           },
      //         },
      //       },
      //       parentUuid: {
      //         type: "string",
      //         validations: [
      //           {
      //             type: "uuid",
      //           },
      //         ],
      //         tag: {
      //           value: {
      //             id: 3,
      //             defaultLabel: "Entity Uuid",
      //             editable: false,
      //           },
      //         },
      //       },
      //       name: {
      //         type: "string",
      //         tag: {
      //           value: {
      //             id: 4,
      //             defaultLabel: "Name",
      //             editable: true,
      //           },
      //         },
      //       },
      //       author: {
      //         type: "string",
      //         validations: [
      //           {
      //             type: "uuid",
      //           },
      //         ],
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 5,
      //             defaultLabel: "Author",
      //             targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
      //             editable: true,
      //           },
      //         },
      //       },
      //       publisher: {
      //         type: "string",
      //         validations: [
      //           {
      //             type: "uuid",
      //           },
      //         ],
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 5,
      //             defaultLabel: "Publisher",
      //             targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
      //             editable: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      //   testValueObject: {
      //     uuid: "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7",
      //     parentName: "Book",
      //     parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      //     name: "Renata n'importe quoi",
      //     author: "e4376314-d197-457c-aa5e-d2da5f8d5977",
      //     publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
      //   },
      // },
      // // Book entity definition
      // test910: {
      //   testSchema: {
      //     type: "schemaReference",
      //     definition: {
      //       absolutePath: miroirFundamentalJzodSchemaUuid,
      //       relativePath: "entityDefinition",
      //     },
      //   },
      //   testValueObject: {
      //     uuid: "797dd185-0155-43fd-b23f-f6d0af8cae06",
      //     parentName: "EntityDefinition",
      //     parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      //     parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
      //     entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      //     conceptLevel: "Model",
      //     name: "Book",
      //     icon: "Book",
      //     defaultInstanceDetailsReportUuid: "c3503412-3d8a-43ef-a168-aa36e975e606",
      //     viewAttributes: ["name", "author", "publisher", "uuid"],
      //     jzodSchema: {
      //       type: "object",
      //       definition: {
      //         uuid: {
      //           type: "uuid",
      //           tag: {
      //             value: {
      //               id: 1,
      //               defaultLabel: "Uuid",
      //               editable: false,
      //             },
      //           },
      //         },
      //         parentName: {
      //           type: "string",
      //           optional: true,
      //           tag: {
      //             value: {
      //               id: 2,
      //               defaultLabel: "Entity Name",
      //               editable: false,
      //             },
      //           },
      //         },
      //         parentUuid: {
      //           type: "uuid",
      //           tag: {
      //             value: {
      //               id: 3,
      //               defaultLabel: "Entity Uuid",
      //               editable: false,
      //             },
      //           },
      //         },
      //         conceptLevel: {
      //           type: "enum",
      //           definition: ["MetaModel", "Model", "Data"],
      //           optional: true,
      //           tag: {
      //             value: {
      //               id: 5,
      //               defaultLabel: "Concept Level",
      //               editable: false,
      //             },
      //           },
      //         },
      //         name: {
      //           type: "string",
      //           tag: {
      //             value: {
      //               id: 4,
      //               defaultLabel: "Name",
      //               editable: true,
      //             },
      //           },
      //         },
      //         author: {
      //           type: "uuid",
      //           optional: true,
      //           tag: {
      //             value: {
      //               id: 5,
      //               defaultLabel: "Author",
      //               targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
      //               editable: true,
      //             },
      //           },
      //         },
      //         publisher: {
      //           type: "uuid",
      //           optional: true,
      //           tag: {
      //             value: {
      //               id: 5,
      //               defaultLabel: "Publisher",
      //               targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
      //               editable: true,
      //             },
      //           },
      //         },
      //       },
      //     },
      //   },
      //   expectedResolvedSchema: {
      //     type: "object",
      //     definition: {
      //       uuid: {
      //         type: "uuid",
      //         tag: {
      //           value: {
      //             id: 1,
      //             defaultLabel: "Uuid",
      //             editable: false,
      //           },
      //         },
      //       },
      //       parentName: {
      //         type: "string",
      //         tag: {
      //           value: {
      //             id: 2,
      //             defaultLabel: "Entity Name",
      //             editable: false,
      //           },
      //         },
      //       },
      //       parentUuid: {
      //         type: "uuid",
      //         tag: {
      //           value: {
      //             id: 3,
      //             defaultLabel: "Entity Uuid",
      //             editable: false,
      //           },
      //         },
      //       },
      //       parentDefinitionVersionUuid: {
      //         type: "uuid",
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 4,
      //             defaultLabel: "Entity Definition Version Uuid",
      //             editable: false,
      //           },
      //         },
      //       },
      //       entityUuid: {
      //         type: "uuid",
      //         tag: {
      //           value: {
      //             id: 6,
      //             defaultLabel: "Entity Uuid of the Entity which this definition is the definition",
      //             editable: false,
      //           },
      //         },
      //       },
      //       conceptLevel: {
      //         type: "enum",
      //         definition: ["MetaModel", "Model", "Data"],
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 7,
      //             defaultLabel: "Concept Level",
      //             editable: false,
      //           },
      //         },
      //       },
      //       name: {
      //         type: "string",
      //         tag: {
      //           value: {
      //             id: 5,
      //             defaultLabel: "Name",
      //             editable: false,
      //           },
      //         },
      //       },
      //       icon: {
      //         type: "string",
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 11,
      //             defaultLabel: "Icon used to represent instances of this Entity",
      //             editable: true,
      //           },
      //         },
      //       },
      //       defaultInstanceDetailsReportUuid: {
      //         type: "uuid",
      //         optional: true,
      //         tag: {
      //           value: {
      //             id: 9,
      //             defaultLabel: "Default Report used to display instances of this Entity",
      //             editable: false,
      //           },
      //         },
      //       },
      //       viewAttributes: {
      //         type: "tuple",
      //         optional: true,
      //         definition: [
      //           {
      //             type: "string",
      //           },
      //           {
      //             type: "string",
      //           },
      //           {
      //             type: "string",
      //           },
      //           {
      //             type: "string",
      //           },
      //         ],
      //         tag: {
      //           value: {
      //             id: 10,
      //             editable: true,
      //           },
      //         },
      //       },
      //       jzodSchema: {
      //         type: "object",
      //         definition: {
      //           type: {
      //             type: "literal",
      //             definition: "object",
      //           },
      //           definition: {
      //             type: "object",
      //             definition: {
      //               uuid: {
      //                 type: "object",
      //                 definition: {
      //                   type: {
      //                     type: "enum",
      //                     definition: [
      //                       "any",
      //                       "bigint",
      //                       "boolean",
      //                       "never",
      //                       "null",
      //                       "uuid",
      //                       "undefined",
      //                       "unknown",
      //                       "void",
      //                     ],
      //                   },
      //                   tag: {
      //                     type: "object",
      //                     optional: true,
      //                     definition: {
      //                       value: {
      //                         type: "object",
      //                         optional: true,
      //                         definition: {
      //                           id: {
      //                             type: "number",
      //                             optional: true,
      //                           },
      //                           defaultLabel: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           editable: {
      //                             type: "boolean",
      //                             optional: true,
      //                           },
      //                         },
      //                       },
      //                     },
      //                   },
      //                 },
      //               },
      //               parentName: {
      //                 type: "object",
      //                 definition: {
      //                   type: {
      //                     type: "literal",
      //                     definition: "string",
      //                   },
      //                   optional: {
      //                     type: "boolean",
      //                     optional: true,
      //                   },
      //                   tag: {
      //                     type: "object",
      //                     optional: true,
      //                     definition: {
      //                       value: {
      //                         type: "object",
      //                         optional: true,
      //                         definition: {
      //                           id: {
      //                             type: "number",
      //                             optional: true,
      //                           },
      //                           defaultLabel: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           editable: {
      //                             type: "boolean",
      //                             optional: true,
      //                           },
      //                         },
      //                       },
      //                     },
      //                   },
      //                 },
      //               },
      //               parentUuid: {
      //                 type: "object",
      //                 definition: {
      //                   type: {
      //                     type: "enum",
      //                     definition: [
      //                       "any",
      //                       "bigint",
      //                       "boolean",
      //                       "never",
      //                       "null",
      //                       "uuid",
      //                       "undefined",
      //                       "unknown",
      //                       "void",
      //                     ],
      //                   },
      //                   tag: {
      //                     type: "object",
      //                     optional: true,
      //                     definition: {
      //                       value: {
      //                         type: "object",
      //                         optional: true,
      //                         definition: {
      //                           id: {
      //                             type: "number",
      //                             optional: true,
      //                           },
      //                           defaultLabel: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           editable: {
      //                             type: "boolean",
      //                             optional: true,
      //                           },
      //                         },
      //                       },
      //                     },
      //                   },
      //                 },
      //               },
      //               conceptLevel: {
      //                 type: "object",
      //                 definition: {
      //                   type: {
      //                     type: "literal",
      //                     definition: "enum",
      //                   },
      //                   definition: {
      //                     type: "tuple",
      //                     definition: [
      //                       {
      //                         type: "string",
      //                       },
      //                       {
      //                         type: "string",
      //                       },
      //                       {
      //                         type: "string",
      //                       },
      //                     ],
      //                   },
      //                   optional: {
      //                     type: "boolean",
      //                     optional: true,
      //                   },
      //                   tag: {
      //                     type: "object",
      //                     optional: true,
      //                     definition: {
      //                       value: {
      //                         type: "object",
      //                         optional: true,
      //                         definition: {
      //                           id: {
      //                             type: "number",
      //                             optional: true,
      //                           },
      //                           defaultLabel: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           editable: {
      //                             type: "boolean",
      //                             optional: true,
      //                           },
      //                         },
      //                       },
      //                     },
      //                   },
      //                 },
      //               },
      //               name: {
      //                 type: "object",
      //                 definition: {
      //                   type: {
      //                     type: "literal",
      //                     definition: "string",
      //                   },
      //                   tag: {
      //                     type: "object",
      //                     optional: true,
      //                     definition: {
      //                       value: {
      //                         type: "object",
      //                         optional: true,
      //                         definition: {
      //                           id: {
      //                             type: "number",
      //                             optional: true,
      //                           },
      //                           defaultLabel: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           editable: {
      //                             type: "boolean",
      //                             optional: true,
      //                           },
      //                         },
      //                       },
      //                     },
      //                   },
      //                 },
      //               },
      //               author: {
      //                 type: "object",
      //                 definition: {
      //                   type: {
      //                     type: "enum",
      //                     definition: [
      //                       "any",
      //                       "bigint",
      //                       "boolean",
      //                       "never",
      //                       "null",
      //                       "uuid",
      //                       "undefined",
      //                       "unknown",
      //                       "void",
      //                     ],
      //                   },
      //                   optional: {
      //                     type: "boolean",
      //                     optional: true,
      //                   },
      //                   tag: {
      //                     type: "object",
      //                     optional: true,
      //                     definition: {
      //                       value: {
      //                         type: "object",
      //                         optional: true,
      //                         definition: {
      //                           id: {
      //                             type: "number",
      //                             optional: true,
      //                           },
      //                           defaultLabel: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           targetEntity: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           editable: {
      //                             type: "boolean",
      //                             optional: true,
      //                           },
      //                         },
      //                       },
      //                     },
      //                   },
      //                 },
      //               },
      //               publisher: {
      //                 type: "object",
      //                 definition: {
      //                   type: {
      //                     type: "enum",
      //                     definition: [
      //                       "any",
      //                       "bigint",
      //                       "boolean",
      //                       "never",
      //                       "null",
      //                       "uuid",
      //                       "undefined",
      //                       "unknown",
      //                       "void",
      //                     ],
      //                   },
      //                   optional: {
      //                     type: "boolean",
      //                     optional: true,
      //                   },
      //                   tag: {
      //                     type: "object",
      //                     optional: true,
      //                     definition: {
      //                       value: {
      //                         type: "object",
      //                         optional: true,
      //                         definition: {
      //                           id: {
      //                             type: "number",
      //                             optional: true,
      //                           },
      //                           defaultLabel: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           targetEntity: {
      //                             type: "string",
      //                             optional: true,
      //                           },
      //                           editable: {
      //                             type: "boolean",
      //                             optional: true,
      //                           },
      //                         },
      //                       },
      //                     },
      //                   },
      //                 },
      //               },
      //             },
      //           },
      //         },
      //       },
      //     },
      //   },
      // },
      // // complexMenu
      // test950: {
      //   testSchema: {
      //     type: "schemaReference",
      //     context: {
      //       menuItem: {
      //         type: "object",
      //         definition: {
      //           label: {
      //             type: "string",
      //           },
      //           section: {
      //             type: "schemaReference",
      //             definition: {
      //               absolutePath: miroirFundamentalJzodSchemaUuid,
      //               relativePath: "applicationSection",
      //             },
      //           },
      //           selfApplication: {
      //             type: "string",
      //             validations: [
      //               {
      //                 type: "uuid",
      //               },
      //             ],
      //             tag: {
      //               value: {
      //                 id: 1,
      //                 defaultLabel: "Uuid",
      //                 editable: false,
      //               },
      //             },
      //           },
      //           reportUuid: {
      //             type: "string",
      //             validations: [
      //               {
      //                 type: "uuid",
      //               },
      //             ],
      //             tag: {
      //               value: {
      //                 id: 1,
      //                 defaultLabel: "Uuid",
      //                 editable: false,
      //               },
      //             },
      //           },
      //           instanceUuid: {
      //             type: "string",
      //             optional: true,
      //             validations: [
      //               {
      //                 type: "uuid",
      //               },
      //             ],
      //             tag: {
      //               value: {
      //                 id: 1,
      //                 defaultLabel: "Uuid",
      //                 editable: false,
      //               },
      //             },
      //           },
      //           icon: {
      //             type: "string",
      //             validations: [
      //               {
      //                 type: "uuid",
      //               },
      //             ],
      //           },
      //         },
      //       },
      //       menuItemArray: {
      //         type: "array",
      //         definition: {
      //           type: "schemaReference",
      //           definition: {
      //             relativePath: "menuItem",
      //           },
      //         },
      //       },
      //       sectionOfMenu: {
      //         type: "object",
      //         definition: {
      //           title: {
      //             type: "string",
      //           },
      //           label: {
      //             type: "string",
      //           },
      //           items: {
      //             type: "schemaReference",
      //             definition: {
      //               relativePath: "menuItemArray",
      //             },
      //           },
      //         },
      //       },
      //       simpleMenu: {
      //         type: "object",
      //         definition: {
      //           menuType: {
      //             type: "literal",
      //             definition: "simpleMenu",
      //           },
      //           definition: {
      //             type: "schemaReference",
      //             definition: {
      //               relativePath: "menuItemArray",
      //             },
      //           },
      //         },
      //       },
      //       complexMenu: {
      //         type: "object",
      //         definition: {
      //           menuType: {
      //             type: "literal",
      //             definition: "complexMenu",
      //           },
      //           definition: {
      //             type: "array",
      //             definition: {
      //               type: "schemaReference",
      //               definition: {
      //                 relativePath: "sectionOfMenu",
      //               },
      //             },
      //           },
      //         },
      //       },
      //       menuDefinition: {
      //         type: "union",
      //         discriminator: "menuType",
      //         definition: [
      //           {
      //             type: "schemaReference",
      //             definition: {
      //               relativePath: "simpleMenu",
      //             },
      //           },
      //           {
      //             type: "schemaReference",
      //             definition: {
      //               relativePath: "complexMenu",
      //             },
      //           },
      //         ],
      //       },
      //     },
      //     definition: {
      //       relativePath: "menuDefinition",
      //     },
      //   },
      //   testValueObject: {
      //     menuType: "complexMenu",
      //     definition: [
      //       {
      //         title: "Miroir",
      //         label: "miroir",
      //         items: [
      //           {
      //             label: "Miroir Entities",
      //             section: "model",
      //             selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      //             reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
      //             icon: "category",
      //           },
      //           {
      //             label: "Miroir Entity Definitions",
      //             section: "model",
      //             selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      //             reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
      //             icon: "category",
      //           },
      //           {
      //             label: "Miroir Reports",
      //             section: "data",
      //             selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      //             reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
      //             icon: "list",
      //           },
      //           {
      //             label: "Miroir Menus",
      //             section: "data",
      //             selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      //             reportUuid: "ecfd8787-09cc-417d-8d2c-173633c9f998",
      //             icon: "list",
      //           },
      //         ],
      //       },
      //       {
      //         title: "Library",
      //         label: "library",
      //         items: [
      //           {
      //             label: "Library Entities",
      //             section: "model",
      //             selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      //             reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
      //             icon: "category",
      //           },
      //           {
      //             label: "Library Entity Definitions",
      //             section: "model",
      //             selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      //             reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
      //             icon: "category",
      //           },
      //           {
      //             label: "Library Tests",
      //             section: "data",
      //             selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      //             reportUuid: "931dd036-dfce-4e47-868e-36dba3654816",
      //             icon: "category",
      //           },
      //           {
      //             label: "Library Books",
      //             section: "data",
      //             selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      //             reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
      //             icon: "auto_stories",
      //           },
      //           {
      //             label: "Library Authors",
      //             section: "data",
      //             selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      //             reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
      //             icon: "star",
      //           },
      //           {
      //             label: "Library Publishers",
      //             section: "data",
      //             selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      //             reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
      //             icon: "account_balance",
      //           },
      //         ],
      //       },
      //     ],
      //   },
      //   expectedResolvedSchema: {
      //     type: "object",
      //     definition: {
      //       menuType: {
      //         type: "literal",
      //         definition: "complexMenu",
      //       },
      //       definition: {
      //         type: "tuple",
      //         definition: [
      //           {
      //             type: "object",
      //             definition: {
      //               title: {
      //                 type: "string",
      //               },
      //               label: {
      //                 type: "string",
      //               },
      //               items: {
      //                 type: "tuple",
      //                 definition: [
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "model",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "model",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "data",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "data",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                 ],
      //               },
      //             },
      //           },
      //           {
      //             type: "object",
      //             definition: {
      //               title: {
      //                 type: "string",
      //               },
      //               label: {
      //                 type: "string",
      //               },
      //               items: {
      //                 type: "tuple",
      //                 definition: [
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "model",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "model",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "data",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "data",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "data",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                   {
      //                     type: "object",
      //                     definition: {
      //                       label: {
      //                         type: "string",
      //                       },
      //                       section: {
      //                         type: "literal",
      //                         definition: "data",
      //                       },
      //                       selfApplication: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       reportUuid: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                         tag: {
      //                           value: {
      //                             id: 1,
      //                             defaultLabel: "Uuid",
      //                             editable: false,
      //                           },
      //                         },
      //                       },
      //                       icon: {
      //                         type: "string",
      //                         validations: [
      //                           {
      //                             type: "uuid",
      //                           },
      //                         ],
      //                       },
      //                     },
      //                   },
      //                 ],
      //               },
      //             },
      //           },
      //         ],
      //       },
      //     },
      //   },
      // },
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
      testParams.expectedSubSchema
    );
  });
  // ###########################################################################################
  // it("miroir entity definition object format", () => {
  //   console.log(expect.getState().currentTestName, "called getMiroirFundamentalJzodSchema");

  //   for (const test of Object.entries(tests)) {
  //     testResolve(
  //       test[0],
  //       test[1].testSchema,
  //       test[1].testValueObject,
  //       test[1].expectedResolvedSchema,
  //       test[1].expectedSubSchema,
  //     );
  //   }
  // });
});