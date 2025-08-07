import { describe, it, expect } from 'vitest';
import {
  JzodElement,
  JzodSchema,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  miroirFundamentalJzodSchema,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";

import { getDefaultValueForJzodSchemaWithResolution, getDefaultValueForJzodSchemaWithResolutionNonHook } from "../../src/1_core/jzod/getDefaultValueForJzodSchema";
import {  } from '../../src';




// ################################################################################################
function testResolve(
  testId: string,
  testSchema: JzodElement,
  expectedResult: JzodElement,
){
  console.log("######################################### running test", testId, "...")
  // const testResult = getDefaultValueForJzodSchemaWithResolution(
  const testResult = getDefaultValueForJzodSchemaWithResolutionNonHook(
    "",
    testSchema,
    undefined, // currentDefaultValue,
    undefined, // currentValuePath,
    undefined, // deploymentEntityState,
    false, // forceOptional,
    undefined, // deploymentUuid,
    miroirFundamentalJzodSchema as JzodSchema, // miroirFundamentalJzodSchema,
      // currentValuePath: string[] = [],
      // deploymentEntityState: ReduxDeploymentsState | undefined = undefined,
      // forceOptional: boolean = false,
      // deploymentUuid: Uuid | undefined,
      // miroirFundamentalJzodSchema: JzodSchema,
      // currentModel?: MetaModel,
      // miroirMetaModel?: MetaModel,
      // relativeReferenceJzodContext?: { [k: string]: JzodElement },
      // rootObject?: any,
  )
    expect(testResult).toEqual(expectedResult);
}

interface testFormat {
  testSchema: JzodElement,
  expectedResult: any,
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe(
  'defaultValueForJzodSchema',
  () => {

    // ###########################################################################################
    it(
      'miroir entity definition object format',
      () => {

        const tests: { [k: string]: testFormat } = {
          // // plain literal!
          test010: {
            testSchema: {
              type: "literal",
              definition: "myLiteral",
            },
            expectedResult: "myLiteral"
          },
          // number
          test020: {
            testSchema: {
              type: "number",
            },
            expectedResult: 0,
          },
          // simpleType
          test030: {
            testSchema: {
              type: "string",
            },
            expectedResult: "",
          },
          // object with attributes
          test040: {
            testSchema: {
              type: "object",
              definition: {
                a: { type: "string" },
                b: { type: "number" },
              }
            },
            expectedResult: {
              a: "",
              b: 0,
            },
          },
          // object with optional attributes
          test050: {
            testSchema: {
              type: "object",
              definition: {
                a: { type: "string" },
                b: { type: "number", optional: true },
              }
            },
            expectedResult: {
              a: "",
            },
          },
          //object with nested object
          test060: {
            testSchema: {
              type: "object",
              definition: {
                a: { type: "string" },
                b: {
                  type: "object",
                  definition: {
                    c: { type: "number" },
                  }
                },
              }
            },
            expectedResult: {
              a: "",
              b: {
                c: 0,
              },
            },
          },
          // array
          test070: {
            testSchema: {
              type: "array",
              definition: { type: "string" },
            },
            expectedResult: [],
          },
        };

        for (const test of Object.entries(tests)) {
          testResolve(test[0], test[1].testSchema, test[1].expectedResult)
          
        }
      }
    )
  }
)
