
import {
  JzodElement,
  JzodObject,
  JzodReference,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// import { JzodReferenceResolutionFunction } from "@miroir-framework/jzod";
import { applyLimitedCarryOnSchema } from "../../../src/1_core/jzod/JzodToJzod";
import { cleanupObject } from "../../../src/tools";

type JzodReferenceResolutionFunction = (schema: JzodReference) => JzodElement | undefined;

interface TestCase {
  name: string,
  testJzodSchema: JzodElement,
  mlElementTemplateJzodSchema: JzodObject | JzodReference,
  mlElementTemplateSchemaDiscriminator?:undefined | string | string[],
  alwaysPropagate?: boolean,
  expectedReferences: Record<string,JzodElement>,
  expectedResult: {schema: JzodElement, hasBeenApplied: boolean},
  resolveJzodReference?: JzodReferenceResolutionFunction, // non-converted reference lookup
  convertedReferences?: Record<string, JzodElement>, // converted reference lookup
}
function runTest(
  t: TestCase
) {
  const testResult = cleanupObject(applyLimitedCarryOnSchema(
    t.testJzodSchema,
    t.mlElementTemplateJzodSchema,
    t.mlElementTemplateSchemaDiscriminator,
    t.alwaysPropagate??false, // alwaysPropagate
    undefined, // mlElementTemplatePrefix
    undefined, // prefixForReference
    undefined, // suffixForReference
    t.resolveJzodReference,
    t.convertedReferences
  ));
  console.log(t.name, "result references=", JSON.stringify(testResult.resolvedReferences, null, 2))
  console.log(t.name, "result=", JSON.stringify(testResult.resultSchema, null, 2))
  // console.log(t.name, "expectedResult=", JSON.stringify(t.expectedResult, null, 2))
  // console.log(t.name, "expectedReferences=", JSON.stringify(t.expectedReferences, null, 2))
  console.log("running test:", t.name)
  expect(testResult.resultSchema).toEqual(t.expectedResult.schema)
  expect(testResult.hasBeenApplied).toEqual(t.expectedResult.hasBeenApplied)
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
    it('jzod mlElementTemplate conversion',
      () => {
        const tests: TestCase[] = [
          // test000: simple string, canBeTemplate=false
          {
            name: "test000",
            testJzodSchema: {
              type: "string",
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "string" },
              },
            },
            expectedResult: {
              schema: {
                type: "string",
              },
              hasBeenApplied: false,
            },
            expectedReferences: undefined as any,
          },
          // test001: simple string, canBeTemplate=true
          {
            name: "test001",
            testJzodSchema: {
              type: "string",
              tag: { value: { canBeTemplate: true } } as any,
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "string" },
              },
            },
            expectedResult: {
              schema: {
                type: "union",
                discriminator: undefined,
                tag: { value: { canBeTemplate: true, isTemplate: true } } as any,
                definition: [
                  {
                    type: "string",
                    tag: { value: { canBeTemplate: true } } as any,
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
              hasBeenApplied: true,
            },
            expectedReferences: undefined as any,
          },
          // test010: simple object schema, no references
          {
            name: "test010",
            testJzodSchema: {
              type: "object",
              definition: {
                a: { type: "string", tag: { value: { canBeTemplate: true } } as any },
                b: {
                  type: "object",
                  definition: {
                    b1: { type: "boolean", optional: true },
                    b2: {
                      type: "array",
                      definition: {
                        type: "boolean",
                        tag: { value: { canBeTemplate: true } } as any,
                      },
                    },
                  },
                },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "string" },
              },
            },
            expectedResult: {
              schema: {
                type: "object",
                definition: {
                  a: {
                    type: "union",
                    tag: {
                      value: {
                        canBeTemplate: true,
                        isTemplate: true,
                      },
                    },
                    definition: [
                      {
                        type: "string",
                        tag: {
                          value: {
                            canBeTemplate: true,
                          },
                        },
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
                          tag: {
                            value: {
                              canBeTemplate: true,
                              isTemplate: true,
                            },
                          },
                          definition: [
                            {
                              type: "boolean",
                              tag: {
                                value: {
                                  canBeTemplate: true,
                                },
                              },
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
              hasBeenApplied: true,
            },
            expectedReferences: {},
          },
          // test015: simple object schema with extend clause wich canBeTemplate, no references
          {
            name: "test015",
            testJzodSchema: {
              type: "object",
              extend: {
                type: "object",
                definition: {
                  a: { type: "string", tag: { value: { canBeTemplate: true } } as any },
                },
              },
              definition: {
                b: {
                  type: "object",
                  definition: {
                    b1: { type: "boolean", optional: true },
                    b2: {
                      type: "array",
                      definition: {
                        type: "boolean",
                        tag: { value: { canBeTemplate: true } } as any,
                      },
                    },
                  },
                },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "string" },
              },
            },
            expectedResult: {
              schema: {
                type: "object",
                extend: [
                  {
                    type: "object",
                    definition: {
                      a: {
                        type: "union",
                        tag: {
                          value: {
                            canBeTemplate: true,
                            isTemplate: true,
                          },
                        },
                        definition: [
                          {
                            type: "string",
                            tag: {
                              value: {
                                canBeTemplate: true,
                              },
                            },
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
                ],
                definition: {
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
                          tag: {
                            value: {
                              canBeTemplate: true,
                              isTemplate: true,
                            },
                          },
                          definition: [
                            {
                              type: "boolean",
                              tag: {
                                value: {
                                  canBeTemplate: true,
                                },
                              },
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
              hasBeenApplied: true,
            },
            expectedReferences: {},
          },
          // test016: simple object schema with extend clause wich canBeTemplate accessed as a reference
          {
            name: "test016",
            testJzodSchema: {
              type: "object",
              extend: {
                type: "object",
                definition: {
                  a: { type: "string", tag: { value: { canBeTemplate: true } } as any },
                },
              },
              definition: {
                b: {
                  type: "object",
                  definition: {
                    b1: { type: "boolean", optional: true },
                    b2: {
                      type: "array",
                      definition: {
                        type: "boolean",
                        tag: { value: { canBeTemplate: true } } as any,
                      },
                    },
                  },
                },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "string" },
              },
            },
            expectedResult: {
              schema: {
                type: "object",
                extend: [
                  {
                    type: "object",
                    definition: {
                      a: {
                        type: "union",
                        tag: {
                          value: {
                            canBeTemplate: true,
                            isTemplate: true,
                          },
                        },
                        definition: [
                          {
                            type: "string",
                            tag: {
                              value: {
                                canBeTemplate: true,
                              },
                            },
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
                ],
                definition: {
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
                          tag: {
                            value: {
                              canBeTemplate: true,
                              isTemplate: true,
                            },
                          },
                          definition: [
                            {
                              type: "boolean",
                              tag: {
                                value: {
                                  canBeTemplate: true,
                                },
                              },
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
              hasBeenApplied: true,
            },
            expectedReferences: {},
          },
          // test020: absolutePath schemaReference with complex mlElementTemplate type, NO canBeTemplate!
          {
            name: "test020",
            testJzodSchema: {
              type: "schemaReference",
              definition: {
                absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                relativePath: "myObject",
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                d: { type: "string" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    myObject: {
                      type: "object",
                      definition: {
                        a: { type: "string" },
                        b: { type: "schemaReference", definition: { relativePath: "myObject" } },
                        c: {
                          type: "array",
                          definition: {
                            type: "schemaReference",
                            definition: { relativePath: "myObject" },
                          },
                        },
                      },
                    },
                    myString: { type: "string" },
                  },
                  definition: { relativePath: "myObject" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myObject",
                },
              },
              hasBeenApplied: false,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myObject: {
                type: "object",
                definition: {
                  a: {
                    type: "string",
                  },
                  b: {
                    type: "schemaReference",
                    definition: {
                      relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myObject",
                    },
                  },
                  c: {
                    type: "array",
                    definition: {
                      type: "schemaReference",
                      definition: {
                        relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myObject",
                      },
                    },
                  },
                },
              },
            },
          },
          // test030: simple base type with absolute schemaReference and simple mlElementTemplate type
          {
            name: "test30",
            testJzodSchema: {
              type: "schemaReference",
              definition: {
                absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                relativePath: "myString",
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "number" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    myString: { type: "string", tag: { value: { canBeTemplate: true } } },
                  },
                  definition: { relativePath: "myString" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
                },
              },
              hasBeenApplied: true,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString: {
                type: "union",
                tag: { value: { canBeTemplate: true, isTemplate: true } },
                definition: [
                  {
                    type: "string",
                    tag: { value: { canBeTemplate: true } },
                  },
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                ],
              },
            },
          },
          // test040: simple base type with absolute schemaReference within object and simple mlElementTemplate type
          {
            name: "test040",
            testJzodSchema: {
              type: "object",
              tag: { value: { canBeTemplate: true } },
              definition: {
                a: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                    relativePath: "myString",
                  },
                },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "number" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    myString: { type: "string", tag: { value: { canBeTemplate: true } } },
                  },
                  definition: { relativePath: "myString" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                tag: {
                  value: {
                    canBeTemplate: true,
                    isTemplate: true,
                  },
                },
                type: "union",
                definition: [
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                  {
                    type: "object",
                    tag: {
                      value: {
                        canBeTemplate: true,
                        isTemplate: true,
                      },
                    },
                    definition: {
                      a: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
                        },
                      },
                    },
                  },
                ],
              },
              hasBeenApplied: true,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString: {
                type: "union",
                tag: { value: { canBeTemplate: true, isTemplate: true } },
                definition: [
                  {
                    type: "string",
                    tag: { value: { canBeTemplate: true } },
                  },
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                ],
              },
            },
          },
          // test050: simple base type with absolute schemaReference within object and union and simple mlElementTemplate type
          {
            name: "test050",
            testJzodSchema: {
              type: "object",
              tag: { value: { canBeTemplate: true } },
              definition: {
                a: {
                  type: "union",
                  tag: { value: { canBeTemplate: true } },
                  definition: [
                    {
                      type: "schemaReference",
                      // tag: { value: { canBeTemplate: true } },
                      definition: {
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "myString",
                      },
                    },
                    {
                      type: "number",
                    },
                  ],
                },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "number" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    myString: { type: "string", tag: { value: { canBeTemplate: true } } },
                  },
                  definition: { relativePath: "myString" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                tag: {
                  value: {
                    canBeTemplate: true,
                    isTemplate: true,
                  },
                },
                type: "union",
                definition: [
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                  {
                    type: "object",
                    tag: {
                      value: {
                        canBeTemplate: true,
                        isTemplate: true,
                      },
                    },
                    definition: {
                      a: {
                        type: "union",
                        tag: {
                          value: {
                            canBeTemplate: true,
                            isTemplate: true,
                          },
                        },
                        definition: [
                          {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
                            },
                          },
                          {
                            type: "number",
                          },
                          {
                            type: "object",
                            definition: {
                              c: {
                                type: "number",
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              hasBeenApplied: true,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString: {
                type: "union",
                tag: { value: { canBeTemplate: true, isTemplate: true } },
                definition: [
                  {
                    type: "string",
                    tag: { value: { canBeTemplate: true } },
                  },
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                ],
              },
            },
          },
          // test060: complex base type with one inner relative schemaReference and one inner absolute schemaReference, on a simple mlElementTemplate type
          {
            name: "test060",
            testJzodSchema: {
              type: "object",
              tag: { value: { canBeTemplate: true } },
              definition: {
                a: {
                  type: "schemaReference",
                  context: {
                    innerString: { type: "string", tag: { value: { canBeTemplate: true } } },
                  },
                  definition: { relativePath: "innerString" },
                },
                b: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                    relativePath: "myString",
                  },
                },
                d: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                    relativePath: "myString",
                  },
                },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "number" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    myString: { type: "string", tag: { value: { canBeTemplate: true } } },
                  },
                  definition: { relativePath: "myString" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                tag: {
                  value: {
                    canBeTemplate: true,
                    isTemplate: true,
                  },
                },
                type: "union",
                definition: [
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                  {
                    type: "object",
                    tag: {
                      value: {
                        canBeTemplate: true,
                        isTemplate: true,
                      },
                    },
                    definition: {
                      a: {
                        type: "schemaReference",
                        context: {
                          innerString: {
                            type: "union",
                            tag: {
                              value: {
                                canBeTemplate: true,
                                isTemplate: true,
                              },
                            },
                            definition: [
                              {
                                type: "string",
                                tag: {
                                  value: {
                                    canBeTemplate: true,
                                  },
                                },
                              },
                              {
                                type: "object",
                                definition: {
                                  c: {
                                    type: "number",
                                  },
                                },
                              },
                            ],
                          },
                        },
                        definition: {
                          relativePath: "innerString",
                        },
                      },
                      b: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
                        },
                      },
                      d: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString",
                        },
                      },
                    },
                  },
                ],
              },
              hasBeenApplied: true,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_myString: {
                type: "union",
                tag: { value: { canBeTemplate: true, isTemplate: true } },
                definition: [
                  {
                    type: "string",
                    tag: { value: { canBeTemplate: true } },
                  },
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                ],
              },
            },
          },
          // test070: object with extend clause using schemaReference based on absolutePath
          {
            name: "test070",
            testJzodSchema: {
              type: "object",
              tag: { value: { canBeTemplate: true } },
              extend: {
                type: "schemaReference",
                definition: {
                  eager: true,
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "extendedObject",
                },
              },
              definition: {
                a: { type: "string", tag: { value: { canBeTemplate: true } } },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "number" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  tag: { value: { canBeTemplate: true } },
                  context: {
                    extendedObject: {
                      type: "object",
                      tag: { value: { canBeTemplate: true } },
                      definition: {
                        b: { type: "number", tag: { value: { canBeTemplate: true } } },
                      },
                    },
                  },
                  definition: { relativePath: "extendedObject" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                tag: {
                  value: {
                    canBeTemplate: true,
                    isTemplate: true,
                  },
                },
                type: "union",
                definition: [
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                  {
                    type: "object",
                    extend: [
                      {
                        type: "schemaReference",
                        definition: {
                          eager: true,
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath:
                            "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject_extend",
                        },
                      },
                    ],
                    tag: {
                      value: {
                        canBeTemplate: true,
                        isTemplate: true,
                      },
                    },
                    definition: {
                      a: {
                        type: "union",
                        tag: {
                          value: {
                            canBeTemplate: true,
                            isTemplate: true,
                          },
                        },
                        definition: [
                          {
                            type: "string",
                            tag: {
                              value: {
                                canBeTemplate: true,
                              },
                            },
                          },
                          {
                            type: "object",
                            definition: {
                              c: {
                                type: "number",
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              hasBeenApplied: true,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject_extend: {
                type: "union",
                tag: { value: { canBeTemplate: true, isTemplate: true } },
                definition: [
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                  {
                    type: "object",
                    tag: { value: { canBeTemplate: true, isTemplate: true } },
                    definition: {
                      b: {
                        type: "union",
                        tag: { value: { canBeTemplate: true, isTemplate: true } },
                        definition: [
                          {
                            type: "number",
                            tag: { value: { canBeTemplate: true } },
                          },
                          {
                            type: "object",
                            definition: {
                              c: {
                                type: "number",
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
          // test080: object with array extend clause using schemaReference based on absolutePath
          {
            name: "test080",
            testJzodSchema: {
              type: "object",
              tag: { value: { canBeTemplate: true } },
              extend: [
                {
                  type: "schemaReference",
                  definition: {
                    eager: true,
                    absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                    relativePath: "extendedObject1",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    eager: true,
                    absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                    relativePath: "extendedObject2",
                  },
                },
              ],
              definition: {
                a: { type: "string", tag: { value: { canBeTemplate: true } } },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "number" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    extendedObject1: {
                      type: "object",
                      tag: { value: { canBeTemplate: true } },
                      definition: {
                        b: { type: "number", tag: { value: { canBeTemplate: true } } },
                      },
                    },
                    extendedObject2: {
                      type: "object",
                      tag: { value: { canBeTemplate: true } },
                      definition: {
                        d: { type: "string", tag: { value: { canBeTemplate: true } } },
                      },
                    },
                  },
                  definition: { relativePath: "extendedObject1" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                tag: {
                  value: {
                    canBeTemplate: true,
                    isTemplate: true,
                  },
                },
                type: "union",
                definition: [
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                  {
                    type: "object",
                    extend: [
                      {
                        type: "schemaReference",
                        definition: {
                          eager: true,
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath:
                            "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject1_extend",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          eager: true,
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath:
                            "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject2_extend",
                        },
                      },
                    ],
                    tag: {
                      value: {
                        canBeTemplate: true,
                        isTemplate: true,
                      },
                    },
                    definition: {
                      a: {
                        type: "union",
                        tag: {
                          value: {
                            canBeTemplate: true,
                            isTemplate: true,
                          },
                        },
                        definition: [
                          {
                            type: "string",
                            tag: {
                              value: {
                                canBeTemplate: true,
                              },
                            },
                          },
                          {
                            type: "object",
                            definition: {
                              c: {
                                type: "number",
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              hasBeenApplied: true,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject1_extend: {
                type: "union",
                tag: { value: { canBeTemplate: true, isTemplate: true } },
                definition: [
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                  {
                    type: "object",
                    tag: { value: { canBeTemplate: true, isTemplate: true } },
                    definition: {
                      b: {
                        type: "union",
                        tag: { value: { canBeTemplate: true, isTemplate: true } },
                        definition: [
                          {
                            type: "number",
                            tag: { value: { canBeTemplate: true } },
                          },
                          {
                            type: "object",
                            definition: {
                              c: {
                                type: "number",
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject2_extend: {
                type: "union",
                tag: { value: { canBeTemplate: true, isTemplate: true } },
                definition: [
                  {
                    type: "object",
                    definition: {
                      c: {
                        type: "number",
                      },
                    },
                  },
                  {
                    type: "object",
                    tag: { value: { canBeTemplate: true, isTemplate: true } },
                    definition: {
                      d: {
                        type: "union",
                        tag: { value: { canBeTemplate: true, isTemplate: true } },
                        definition: [
                          {
                            type: "string",
                            tag: { value: { canBeTemplate: true } },
                          },
                          {
                            type: "object",
                            definition: {
                              c: {
                                type: "number",
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
          // test090: non-altered object with extend clause using schemaReference with mlElementTemplate type
          {
            name: "test090",
            testJzodSchema: {
              type: "object",
              // tag: { value: { canBeTemplate: true } },
              extend: {
                type: "schemaReference",
                definition: {
                  eager: true,
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "extendedObject",
                },
              },
              definition: {
                a: { type: "string" },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "number" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    extendedObject: {
                      type: "object",
                      definition: {
                        b: { type: "number", tag: { value: { canBeTemplate: true } } },
                      },
                    },
                  },
                  definition: { relativePath: "extendedObject" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                type: "object",
                extend: [
                  {
                    type: "schemaReference",
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      eager: true,
                      relativePath:
                        "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject_extend",
                    },
                  },
                ],
                definition: {
                  a: {
                    type: "string",
                  },
                },
              },
              hasBeenApplied: true,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_extendedObject_extend: {
                type: "object",
                definition: {
                  b: {
                    type: "union",
                    tag: { value: { canBeTemplate: true, isTemplate: true } },
                    definition: [
                      {
                        type: "number",
                        tag: { value: { canBeTemplate: true } },
                      },
                      {
                        type: "object",
                        definition: {
                          c: {
                            type: "number",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          // test100: non-altered record which element subtype has canBeTemplate
          {
            name: "test100",
            testJzodSchema: {
              type: "record",
              definition: {
                type: "string",
                tag: { value: { canBeTemplate: true } },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "object",
              definition: {
                c: { type: "number" },
              },
            },
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => undefined,
            expectedResult: {
              schema: {
                type: "record",
                definition: {
                  type: "union",
                  tag: {
                    value: {
                      canBeTemplate: true,
                      isTemplate: true,
                    },
                  },
                  definition: [
                    {
                      type: "string",
                      tag: {
                        value: {
                          canBeTemplate: true,
                        },
                      },
                    },
                    {
                      type: "object",
                      definition: {
                        c: {
                          type: "number",
                        },
                      },
                    },
                  ],
                },
              },
              hasBeenApplied: true,
            },
            expectedReferences: {},
          },
          // test110: an array of string items which canBeTemplate of a schemaReference to a discriminated union
          {
            name: "test110",
            testJzodSchema: {
              type: "array",
              // tag: { value: { canBeTemplate: true } },
              definition: { type: "string", tag: { value: { canBeTemplate: true } } },
            },
            mlElementTemplateJzodSchema: {
              type: "schemaReference",
              definition: {
                eager: true,
                absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                relativePath: "discriminatedUnion",
              },
            },
            mlElementTemplateSchemaDiscriminator: "type",
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    discriminatedUnion: {
                      type: "union",
                      discriminator: "type",
                      definition: [
                        {
                          type: "object",
                          definition: {
                            type: { type: "literal", definition: "A" },
                            a: { type: "string" },
                          },
                        },
                        {
                          type: "object",
                          definition: {
                            type: { type: "literal", definition: "B" },
                            b: { type: "number" },
                          },
                        },
                      ],
                    },
                  },
                  definition: { relativePath: "discriminatedUnion" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                type: "array",
                definition: {
                  type: "union",
                  tag: {
                    value: {
                      canBeTemplate: true,
                      isTemplate: true,
                    },
                  },
                  discriminator: "type",
                  definition: [
                    {
                      type: "string",
                      tag: {
                        value: {
                          canBeTemplate: true,
                        },
                      },
                    },
                    {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "discriminatedUnion",
                      },
                    },
                  ],
                },
              },
              hasBeenApplied: true,
            },
            expectedReferences: {},
          },
          // test120: like 110, but always propagate for an array of string items which canBeTemplate of a schemaReference to a discriminated union
          {
            name: "test120",
            testJzodSchema: {
              type: "array",
              // tag: { value: { canBeTemplate: true } },
              definition: { type: "string", tag: { value: { canBeTemplate: true } } },
            },
            mlElementTemplateJzodSchema: {
              type: "schemaReference",
              definition: {
                eager: true,
                absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                relativePath: "discriminatedUnion",
              },
            },
            mlElementTemplateSchemaDiscriminator: "type",
            alwaysPropagate: true,
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    discriminatedUnion: {
                      type: "union",
                      discriminator: "type",
                      definition: [
                        {
                          type: "object",
                          definition: {
                            type: { type: "literal", definition: "A" },
                            a: { type: "string" },
                          },
                        },
                        {
                          type: "object",
                          definition: {
                            type: { type: "literal", definition: "B" },
                            b: { type: "number" },
                          },
                        },
                      ],
                    },
                  },
                  definition: { relativePath: "discriminatedUnion" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                type: "union",
                definition: [
                  {
                    type: "array",
                    definition: {
                      type: "union",
                      tag: {
                        value: {
                          canBeTemplate: true,
                          isTemplate: true,
                        },
                      },
                      discriminator: "type",
                      definition: [
                        {
                          type: "string",
                          tag: {
                            value: {
                              canBeTemplate: true,
                            },
                          },
                        },
                        {
                          type: "schemaReference",
                          definition: {
                            eager: true,
                            absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                            relativePath: "discriminatedUnion",
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      eager: true,
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "discriminatedUnion",
                    },
                  },
                ],
                discriminator: "type",
              },
              hasBeenApplied: true,
            },
            expectedReferences: {},
          },
          // test130: an array of schemaReferences items which canBeTemplate of a schemaReference to a discriminated union
          {
            name: "test130",
            testJzodSchema: {
              type: "array",
              // tag: { value: { canBeTemplate: true } },
              definition: {
                type: "schemaReference",
                tag: { value: { canBeTemplate: true } },
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "stringItem",
                },
              },
            },
            mlElementTemplateJzodSchema: {
              type: "schemaReference",
              definition: {
                eager: true,
                absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                relativePath: "discriminatedUnion",
              },
            },
            mlElementTemplateSchemaDiscriminator: "type",
            resolveJzodReference: (ref: JzodReference): JzodElement | undefined => {
              const store: Record<string, JzodReference> = {
                "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
                  type: "schemaReference",
                  context: {
                    // stringItem: { type: "string", tag: { value: { canBeTemplate: true } } },
                    stringItem: { type: "string" },
                    discriminatedUnion: {
                      type: "union",
                      discriminator: "type",
                      definition: [
                        {
                          type: "object",
                          definition: {
                            type: { type: "literal", definition: "A" },
                            a: { type: "string" },
                          },
                        },
                        {
                          type: "object",
                          definition: {
                            type: { type: "literal", definition: "B" },
                            b: { type: "number" },
                          },
                        },
                      ],
                    },
                  },
                  definition: { relativePath: "discriminatedUnion" },
                },
              };
              const resolvedAbsolutePath = store[ref.definition?.absolutePath ?? ""];
              return resolvedAbsolutePath && resolvedAbsolutePath.context
                ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
                : undefined;
            },
            expectedResult: {
              schema: {
                type: "array",
                definition: {
                  type: "union",
                  tag: {
                    value: {
                      canBeTemplate: true,
                      isTemplate: true,
                    },
                  },
                  discriminator: ["type"],
                  definition: [
                    {
                      type: "schemaReference",
                      tag: {
                        value: {
                          canBeTemplate: true,
                          isTemplate: true,
                        },
                      },
                      definition: {
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_stringItem",
                      },
                    },
                    {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "discriminatedUnion",
                      },
                    },
                  ],
                },
              },
              hasBeenApplied: true,
            },
            expectedReferences: {
              mlElementTemplate_1e8dab4b$65a3$4686$922e$ce89a2d62aa9_stringItem: {
                type: "string",
              },
            },
          },
        ];
        for (const t of tests) {
          runTest(t)
        }
      }
    )
  }
)



