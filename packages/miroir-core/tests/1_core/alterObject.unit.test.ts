import {
  JzodElement
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { alterObjectAtPath } from "../../src/1_core/alterObjectAtPath";











function testResolve(
  testId: string,
  object: any,
  path: string[],
  value: any,
  expectedResult: JzodElement,
){
  console.log("######################################### running test", testId, "...")
  const testResult = alterObjectAtPath(
    object,
    path,
    value
  )
    console.log("test", testId, "has result", JSON.stringify(testResult, null, 2));
    expect(testResult).toEqual(expectedResult);
}

interface testFormat {
  // testId: string,
  object: any,
  path: string[],
  value: any,
  expectedResult: any,
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe(
  'alterObject',
  () => {

    // ###########################################################################################
    it(
      'miroir entity definition object format',
      () => {

        const tests: { [k: string]: testFormat } = {
          // replace root!
          test010: {
            object: {
              type: "literal",
              definition: "myLiteral",
            },
            path: [],
            value: "result",
            expectedResult: "result",
          },
          // simple object
          test020: {
            object: {
              a: "a",
              b: "b",
            },
            path: ["a"],
            value: "replaced",
            expectedResult: {
              a: "replaced",
              b: "b",
            },
          },
          // object in object
          test030: {
            object: {
              a: "a",
              b: {
                c: "c",
                d: "d",
              },
            },
            path: [ "b", "c" ],
            value: "replaced",
            expectedResult: {
              a: "a",
              b: {
                c: "replaced",
                d: "d",
              },
            },
          },
        };

        for (const test of Object.entries(tests)) {
          testResolve(test[0], test[1].object, test[1].path, test[1].value, test[1].expectedResult)
        }
      }
    )
  }
)
