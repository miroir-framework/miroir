import { describe, expect, it } from 'vitest';
import {
  JzodElement,
  JzodSchema
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { jzodTypeCheck, ResolvedJzodSchemaReturnType } from "../../../src/1_core/jzod/jzodTypeCheck";
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

  console.log("test", testId, "has result", JSON.stringify(testResult, null, 2));
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
  //  else {
  //   // console.log("test", testId, "failed with error", testResult.error);
  //   expect(testResult.status, testId).toEqual("error");
  // }
}

interface testFormat {
  // testId: string,
  // miroirFundamentalJzodSchema: JzodSchema;
  testSchema: JzodElement;
  testValueObject: any;
  expectedResult?: ResolvedJzodSchemaReturnType;
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
      // // simple types
      // literal with number value
      test010: {
        testSchema: {
          type: "literal",
          definition: "myLiteral",
        },
        testValueObject: 42,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "literal",
          valuePath: [],
          typePath: [],
          value: 42,
          rawSchema: {
            type: "literal",
            definition: "myLiteral",
          },
        },
      },
      // string with number value
      test011: {
        testSchema: {
          type: "string",
        },
        testValueObject: 42,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "string",
          valuePath: [],
          typePath: [],
          value: 42,
          rawSchema: {
            type: "string",
          },
        },
      },
      // number with string value
      test012: {
        testSchema: {
          type: "number",
        },
        testValueObject: "42",
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "number",
          valuePath: [],
          typePath: [],
          value: "42",
          rawSchema: {
            type: "number",
          },
        },
      },
      // bigint with number value
      test013: {
        testSchema: {
          type: "bigint",
        },
        testValueObject: 42,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "bigint",
          valuePath: [],
          typePath: [],
          value: 42,
          rawSchema: {
            type: "bigint",
          },
        },
      },
      // string with boolean value
      test014: {
        testSchema: {
          type: "string",
        },
        testValueObject: true,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "string",
          valuePath: [],
          typePath: [],
          value: true,
          rawSchema: {
            type: "string",
          },
        },
      },
      // number with null value
      test015: {
        testSchema: {
          type: "number",
        },
        testValueObject: null,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck expected a value but got null for non-optional schema",
          rawJzodSchemaType: "number",
          valuePath: [],
          typePath: [],
          value: null,
          rawSchema: {
            type: "number",
          },
        },
      },
      // bigint with string value
      test016: {
        testSchema: {
          type: "bigint",
        },
        testValueObject: "42n",
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "bigint",
          valuePath: [],
          typePath: [],
          value: "42n",
          rawSchema: {
            type: "bigint",
          },
        },
      },
      // boolean with number value
      test017: {
        testSchema: {
          type: "boolean",
        },
        testValueObject: 42,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "boolean",
          valuePath: [],
          typePath: [],
          value: 42,
          rawSchema: {
            type: "boolean",
          },
        },
      },
      // boolean with string value
      test018: {
        testSchema: {
          type: "boolean",
        },
        testValueObject: "true",
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "boolean",
          valuePath: [],
          typePath: [],
          value: "true",
          rawSchema: {
            type: "boolean",
          },
        },
      },
      // boolean with null value
      test019: {
        testSchema: {
          type: "boolean",
        },
        testValueObject: null,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck expected a value but got null for non-optional schema",
          rawJzodSchemaType: "boolean",
          valuePath: [],
          typePath: [],
          value: null,
          rawSchema: {
            type: "boolean",
          },
        },
      },
      // uuid with string value
      test020: {
        testSchema: {
          type: "uuid",
        },
        testValueObject: "not-a-uuid",
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "uuid",
          valuePath: [],
          typePath: [],
          value: "not-a-uuid",
          rawSchema: {
            type: "uuid",
          },
        },
      },
      // uuid with number value
      test021: {
        testSchema: {
          type: "uuid",
        },
        testValueObject: 123,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "uuid",
          valuePath: [],
          typePath: [],
          value: 123,
          rawSchema: {
            type: "uuid",
          },
        },
      },
      // date with string value
      test022: {
        testSchema: {
          type: "date",
        },
        testValueObject: "not-a-date",
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "date",
          valuePath: [],
          typePath: [],
          value: "not-a-date",
          rawSchema: {
            type: "date",
          },
        },
      },
      // date with number value
      test023: {
        testSchema: {
          type: "date",
        },
        testValueObject: 12345,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "date",
          valuePath: [],
          typePath: [],
          value: 12345,
          rawSchema: {
            type: "date",
          },
        },
      },
      // date with null value
      test024: {
        testSchema: {
          type: "date",
        },
        testValueObject: null,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck expected a value but got null for non-optional schema",
          rawJzodSchemaType: "date",
          valuePath: [],
          typePath: [],
          value: null,
          rawSchema: {
            type: "date",
          },
        },
      },
      // Test null values for non-nullable non-optional simple types
      test025: {
        testSchema: {
          type: "string",
        },
        testValueObject: null,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck expected a value but got null for non-optional schema",
          rawJzodSchemaType: "string",
          valuePath: [],
          typePath: [],
          value: null,
          rawSchema: {
            type: "string",
          },
        },
      },
      // number with null value
      test026: {
        testSchema: {
          type: "number",
        },
        testValueObject: null,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck expected a value but got null for non-optional schema",
          rawJzodSchemaType: "number",
          valuePath: [],
          typePath: [],
          value: null,
          rawSchema: {
            type: "number",
          },
        },
      },
      // bigint with null value
      test027: {
        testSchema: {
          type: "bigint",
        },
        testValueObject: null,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck expected a value but got null for non-optional schema",
          rawJzodSchemaType: "bigint",
          valuePath: [],
          typePath: [],
          value: null,
          rawSchema: {
            type: "bigint",
          },
        },
      },
      // boolean with null value
      test028: {
        testSchema: {
          type: "boolean",
        },
        testValueObject: null,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck expected a value but got null for non-optional schema",
          rawJzodSchemaType: "boolean",
          valuePath: [],
          typePath: [],
          value: null,
          rawSchema: {
            type: "boolean",
          },
        },
      },
      // uuid with null value
      test029: {
        testSchema: {
          type: "uuid",
        },
        testValueObject: null,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck expected a value but got null for non-optional schema",
          rawJzodSchemaType: "uuid",
          valuePath: [],
          typePath: [],
          value: null,
          rawSchema: {
            type: "uuid",
          },
        },
      },
      // date with null value
      test030: {
        testSchema: {
          type: "date",
        },
        testValueObject: "not-a-date",
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "date",
          valuePath: [],
          typePath: [],
          value: "not-a-date",
          rawSchema: {
            type: "date",
          },
        },
      },
      // date with number value
      test031: {
        testSchema: {
          type: "date",
        },
        testValueObject: 123456789,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "date",
          valuePath: [],
          typePath: [],
          value: 123456789,
          rawSchema: {
            type: "date",
          },
        },
      },
      // date with boolean value
      test032: {
        testSchema: {
          type: "date",
        },
        testValueObject: true,
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "date",
          valuePath: [],
          typePath: [],
          value: true,
          rawSchema: {
            type: "date",
          },
        },
      },
      // date with not ISO format string value
      test033: {
        testSchema: {
          type: "date",
          // format: "iso",
        },
        testValueObject: "2023/01/01", // Not ISO format
        expectedResult: {
          status: "error",
          error: "jzodTypeCheck failed to match object value with schema",
          rawJzodSchemaType: "date",
          valuePath: [],
          typePath: [],
          value: "2023/01/01",
          rawSchema: {
            type: "date",
          },
        },
      },
      // ##########################################################################################
      // simple object leaf error
      test100: {
        testSchema: {
          type: "object",
          definition: {
            name: { type: "string" },
            age: { type: "number" },
          },
        },
        testValueObject: { name: 30, age: "John" },
        expectedResult: {
          status: "error",
          error:
            "jzodTypeCheck failed to match some object value attribute(s) with the schema of that attribute(s)",
          rawJzodSchemaType: "object",
          valuePath: [],
          typePath: [],
          errorOnValueAttributes: ["name", "age"],
          innerError: {
            name: {
              status: "error",
              error: "jzodTypeCheck failed to match object value with schema",
              rawJzodSchemaType: "string",
              valuePath: ["name"],
              typePath: ["name"],
              value: 30,
              rawSchema: {
                type: "string",
              },
            },
            age: {
              status: "error",
              error: "jzodTypeCheck failed to match object value with schema",
              rawJzodSchemaType: "number",
              valuePath: ["age"],
              typePath: ["age"],
              value: "John",
              rawSchema: {
                type: "number",
              },
            },
          },
        },
      },
      // simple object with attribute mismatch
      test110: {
        testSchema: {
          type: "object",
          definition: {
            name: { type: "string" },
            age: { type: "number" },
          },
        },
        testValueObject: { name: "John", age: 30, unknownAttribute: "error" }, // 'age' is a string instead of a number
        expectedResult: {
          status: "error",
          error:
            "jzodTypeCheck failed to match some object value attribute(s) with the schema of that attribute(s)",
          rawJzodSchemaType: "object",
          valuePath: [],
          typePath: [],
          errorOnValueAttributes: ["unknownAttribute"],
          innerError: {
            unknownAttribute: {
              status: "error",
              error:
                "jzodTypeCheck value attribute 'unknownAttribute' not found in schema definition",
              rawJzodSchemaType: "object",
              valuePath: ["unknownAttribute"],
              typePath: [],
              value: {
                name: "John",
                age: 30,
                unknownAttribute: "error",
              },
              rawSchema: {
                type: "object",
                definition: {
                  name: {
                    type: "string",
                  },
                  age: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
      },
      // 2-level object of objects with type error in 1 leaf
      test120: {
        testSchema: {
          type: "object",
          definition: {
            person: {
              type: "object",
              definition: {
                name: { type: "string" },
                age: { type: "number" },
              },
            },
            address: {
              type: "object",
              definition: {
                street: { type: "string" },
                city: { type: "string" },
              },
            },
          },
        },
        testValueObject: {
          person: { name: 30, age: 30 }, // error in 'name'
          address: { street: "Main St", city: "Springfield" },
        },
        expectedResult: {
          status: "error",
          error:
            "jzodTypeCheck failed to match some object value attribute(s) with the schema of that attribute(s)",
          rawJzodSchemaType: "object",
          valuePath: [],
          typePath: [],
          errorOnValueAttributes: ["person"],
          innerError: {
            person: {
              status: "error",
              error:
                "jzodTypeCheck failed to match some object value attribute(s) with the schema of that attribute(s)",
              rawJzodSchemaType: "object",
              valuePath: ["person"],
              typePath: ["person"],
              errorOnValueAttributes: ["name"],
              innerError: {
                name: {
                  status: "error",
                  error: "jzodTypeCheck failed to match object value with schema",
                  rawJzodSchemaType: "string",
                  valuePath: ["person", "name"],
                  typePath: ["person", "name"],
                  value: 30,
                  rawSchema: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      // 2-level object of objects with missing mandatory attribute in 1 leaf
      test130: {
        testSchema: {
          type: "object",
          definition: {
            person: {
              type: "object",
              definition: {
                name: { type: "string" },
                age: { type: "number" },
              },
            },
            address: {
              type: "object",
              definition: {
                street: { type: "string" },
                city: { type: "string" },
              },
            },
          },
        },
        testValueObject: {
          person: { name: "John" }, // missing 'age'
          address: { street: "Main St", city: "Springfield" },
        },
        expectedResult: {
          status: "error",
          error:
            "jzodTypeCheck failed to match some object value attribute(s) with the schema of that attribute(s)",
          rawJzodSchemaType: "object",
          valuePath: [],
          typePath: [],
          errorOnValueAttributes: ["person"],
          innerError: {
            person: {
              status: "error",
              error:
                "jzodTypeCheck failed to match some mandatory object value attribute(s) with the schema of that attribute(s)",
              rawJzodSchemaType: "object",
              valuePath: ["person"],
              typePath: ["person"],
              errorOnSchemaAttributes: ["age"],
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