import { describe, expect, it } from 'vitest';
// import describe  from 'jest';
// import it from 'jest';
// import expect from 'jest';

import {
  JzodElement,
  MlSchema
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { localizeJzodSchemaReferenceContext } from "../../../src/1_core/jzod/JzodUnfoldSchemaOnce";


import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import { defaultMiroirMetaModel } from '../../../src/1_core/Model';
const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as MlSchema;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################


function testLocalizeReferenceContext(
  testId: string,
  miroirFundamentalJzodSchema: MlSchema,
  // testSchema: JzodReference,
  testSchema: JzodElement,
  expectedResult: JzodElement,
){
  console.log("######################################### running test", testId, "...")
  const testResult = localizeJzodSchemaReferenceContext(
    miroirFundamentalJzodSchema,
    testSchema,
    defaultMiroirMetaModel,
    defaultMiroirMetaModel,
    (testSchema as any)["context"]??{},
  )
    expect(testResult).toEqual(expectedResult);
}

interface testFormat {
  // testId: string,
  // testSchema: JzodElement,
  miroirFundamentalJzodSchema: MlSchema,
  testSchema: JzodElement,
  // testValueObject: any,
  expectedResult: JzodElement,
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe(
  'localizeReferenceContext',
  () => {

    // ###########################################################################################
    it(
      'miroir entity definition object format',
      () => {
        console.log(expect.getState().currentTestName, "called getMiroirFundamentalJzodSchema");
    
        const tests: { [k: string]: testFormat } = {
          // plain literal!
          test010: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "literal",
              definition: "myLiteral",
            },
            expectedResult: {
              type: "literal",
              definition: "myLiteral",
            },
          },
          //plain object
          test020: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
                b: {
                  type: "number",
                }
              }
            },
            expectedResult: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
                b: {
                  type: "number",
                }
              }
            },
          },
          // schemaReference: object, recursive, 1-level valueObject
          test040: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "schemaReference",
              context: {
                "myObject": {
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
                          definition: { relativePath: "myObject"}
                        }
                      ]
                    }
                  }
                }
              },
              definition: { relativePath: "myObject" }
            },
            expectedResult: { // context is omitted, has dangling "myObject" reference
              type: "schemaReference",
              context: {
                "myObject": {
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
                          context: {
                            "myObject": {
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
                                      definition: { relativePath: "myObject"}
                                    }
                                  ]
                                }
                              }
                            }
                          },
                          definition: { relativePath: "myObject"}
                        }
                      ]
                    }
                  }
                }
              },
              definition: { relativePath: "myObject" }
            },
          },
          // // schemaReference: object, recursive, 2-level valueObject
        };

        for (const test of Object.entries(tests)) {
          testLocalizeReferenceContext(test[0], test[1].miroirFundamentalJzodSchema, test[1].testSchema, test[1].expectedResult)
          
        }
      }
    )
  }
)
