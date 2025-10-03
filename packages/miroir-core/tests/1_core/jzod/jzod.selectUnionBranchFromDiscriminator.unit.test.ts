import { describe, expect, it } from 'vitest';
import {
  JzodEnum,
  JzodLiteral,
  JzodObject
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { selectUnionBranchFromDiscriminator } from '../../../src/1_core/jzod/jzodTypeCheck';
import { defaultMetaModelEnvironment } from '../../../src/1_core/Model';

// Helper to create a JzodObject with a literal discriminator
function makeObjectWithLiteralDiscriminators(discriminators: [string, string][]): JzodObject {
  const definition: Record<string, JzodLiteral | { type: "string" }> = {};
  for (const [discriminator, value] of discriminators) {
    definition[discriminator] = {
      type: "literal",
      definition: value
    } as JzodLiteral;
  }
  definition["foo"] = { type: "string" };
  return {
    type: "object",
    definition
  };
}

// Helper to create a JzodObject with an enum discriminator
function makeObjectWithEnumDiscriminator(discriminator: string, values: string[]): JzodObject {
  return {
    type: "object",
    definition: {
      [discriminator]: {
        type: "enum",
        definition: values
      } as JzodEnum,
      foo: { type: "string" }
    }
  };
}

// ################################################################################################
describe("selectUnionBranchFromDiscriminator", () => {
  // ##############################################################################################
  it("returns error if discriminator is not found in the value object and at least 2 options are possible", () => {
    const discriminator = "type";
    const objA = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator, "B"]]);
    const valueObject = { foo: "bar" }; // No 'type' field

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/no discriminator values found in valueObject and multiple choices exist/);
  });

  // ###############################################################################################
  it("returns error if no branch matches the discriminator value, and at least 2 options are possible", () => {
    console.log("Testing", expect.getState().currentTestName);
    const discriminator = "type";
    const objA = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator, "B"]]);
    const valueObject = { type: "C", foo: "bar" };

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/found no match/);
  });

  // ##############################################################################################
  it("returns error if multiple branches match the discriminator value", () => {
    const discriminator = "type";
    const objA1 = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const objA2 = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const valueObject = { type: "A", foo: "bar" };

    const result = selectUnionBranchFromDiscriminator(
      [objA1, objA2],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/found many matches/);
  });

    // ##############################################################################################
  it("returns error if first entry a discriminator array matches many options and second entry is not found in valueObject (thus matches 0)", () => {
    const discriminator = ["type", "kind"];
    const objA = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "B"]]);
    const valueObject = { type: "A", foo: "bar" }; // No 'kind' field

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/found no match/);
  });

  // ##############################################################################################
  it("returns error if first entry a discriminator array matches many options and second entry matches no option", () => {
    const discriminator = ["type", "kind"];
    const objA = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "B"]]);
    const valueObject = { type: "A", kind: "C", foo: "bar" }; // No 'kind' field

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/found no match/);
  });

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // TODO: in a union, there must be at least 2 branches to select from, so this case should not happen
  it("returns the given type if only 1 is provided, even if it does not match the given discriminator", () => {
    const discriminator = "type";
    const objA = makeObjectWithLiteralDiscriminators([[discriminator, "C"]]);
    const valueObject = { type: "A", foo: "bar" };
    const result = selectUnionBranchFromDiscriminator(
      [objA],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objA);
    }
  });


  // ##############################################################################################
  it("selects the correct branch for a literal discriminator", () => {
    const discriminator = "type";
    const objA = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator, "B"]]);
    const valueObject = { type: "B", foo: "bar" };

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objB);
    }
  });

  // ##############################################################################################
  it("selects the correct branch for an enum discriminator", () => {
    const discriminator = "kind";
    const objEnum = makeObjectWithEnumDiscriminator(discriminator, ["X", "Y"]);
    const objOther = makeObjectWithLiteralDiscriminators([[discriminator, "Z"]]);
    const valueObject = { kind: "Y", foo: "baz" };

    const result = selectUnionBranchFromDiscriminator(
      [objEnum, objOther],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objEnum);
    }
  });

  // ##############################################################################################
  it("selects the correct branch for an enum with multiple values", () => {
    const discriminator = "kind";
    const objEnum = makeObjectWithEnumDiscriminator(discriminator, ["X", "Y", "Z"]);
    const valueObject = { kind: "Z", foo: "baz" };

    const result = selectUnionBranchFromDiscriminator(
      [objEnum],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objEnum);
    }
  });

  // ##############################################################################################
  it("returns found branch based on the first entry in a discriminator array if only 1 option matches, even if the discriminator features many items", () => {
    const discriminator = ["type", "kind"];
    const objA = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "B"]]);
    const valueObject = { type: "B", foo: "bar" };

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objB);
    }
  });

  // ##############################################################################################
  it("returns found branch based on the second entry in a discriminator array if only 1 option matches", () => {
    const discriminator = ["type", "kind"];
    const objA = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "B"]]);
    const valueObject = { type: "A", kind: "B", foo: "bar" };
    
    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {}
    );
    
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objB);
    }
  });

  // #################################################################################################
  it("returns found branch based on the first entry in a discriminator array if one of the entries has the discrimitator in an 'extend' clause", () => {
    const discriminator = ["type", "kind"];
    const objA: JzodObject = {
      type: "object",
      extend: [
        {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "abstractObject",
          },
          context: {},
        },
      ],
      definition: {
        [discriminator[1]]: { type: "literal", definition: "A" },
        foo: { type: "string" },
      },
    };
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "B"], [discriminator[1], "B"]]);
    const valueObject = { type: "A", kind: "A", foo: "bar" };
    
    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      defaultMetaModelEnvironment,
      {
        abstractObject: {
          type: "object",
          definition: {
            [discriminator[0]]: { type: "literal", definition: "A" },
          },
        },
      }
    );
    
    // console.log("currentDiscriminatedObjectJzodSchema", JSON.stringify(currentDiscriminatedObjectJzodSchema, null, 2));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual({
        type: "object",
        definition: {
          type: {
            type: "literal",
            definition: "A",
          },
          kind: {
            type: "literal",
            definition: "A",
          },
          foo: {
            type: "string",
          },
        },
      });
    }
  });

  // #################################################################################################
  it("returns the correct branch for combinerByRelationReturningObjectList in combinerTemplate", () => {
    const unionObjectChoices: JzodObject[] = [
      // extractorForObjectByDirectReference
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorForObjectByDirectReference",
          },
          instanceUuid: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_InnerReference",
            },
            context: {},
          },
        },
      },
      // combinerForObjectByRelation
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: { type: "literal", definition: "combinerForObjectByRelation" },
          objectReference: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForRuntime_InnerReference",
            },
            context: {},
          },
          AttributeOfObjectToCompareToReferenceUuid: { type: "string" },
        },
      },
      // combinerByRelationReturningObjectList
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "combinerByRelationReturningObjectList",
          },
          orderBy: {
            type: "object",
            optional: true,
            definition: {
              attributeName: { type: "string" },
              direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
            },
          },
          objectReference: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForRuntime_InnerReference",
            },
            context: {},
          },
          objectReferenceAttribute: { type: "string", optional: true },
          AttributeOfListObjectToCompareToReferenceUuid: { type: "string" },
        },
      },
      // combinerByManyToManyRelationReturningObjectList
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "combinerByManyToManyRelationReturningObjectList",
          },
          orderBy: {
            type: "object",
            optional: true,
            definition: {
              attributeName: { type: "string" },
              direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
            },
          },
          objectListReference: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForRuntime_contextReference",
            },
            context: {},
          },
          objectListReferenceAttribute: { type: "string", optional: true },
          AttributeOfRootListObjectToCompareToListReferenceUuid: {
            type: "string",
            optional: true,
          },
        },
      },
      // extractorCombinerByHeteronomousManyToManyReturningListOfObjectList
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList",
          },
          rootExtractorOrReference: {
            type: "union",
            discriminator: "extractorOrCombinerType",
            definition: [
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "extractorOrCombinerTemplate",
                },
                context: {},
              },
              { type: "string" },
            ],
          },
          subQueryTemplate: {
            type: "object",
            definition: {
              query: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "extractorOrCombinerTemplate",
                },
                context: {},
              },
              rootQueryObjectTransformer: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "recordOfTransformers",
                },
                context: {},
              },
            },
          },
        },
      },
      // literal
      {
        type: "object",
        definition: {
          extractorTemplateType: { type: "literal", definition: "literal" },
          definition: { type: "string" },
        },
      },
      // extractorTemplateByExtractorWrapperReturningObject
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorTemplateByExtractorWrapperReturningObject",
          },
          definition: {
            type: "record",
            definition: {
              type: "schemaReference",
              definition: {
                relativePath: "transformer_contextOrParameterReferenceTO_REMOVE",
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              },
              context: {},
            },
          },
        },
      },
      // extractorTemplateByExtractorWrapperReturningList
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorTemplateByExtractorWrapperReturningList",
          },
          definition: {
            type: "array",
            definition: {
              type: "schemaReference",
              definition: {
                relativePath: "transformer_contextOrParameterReferenceTO_REMOVE",
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              },
              context: {},
            },
          },
        },
      },
      // extractorTemplateForObjectListByEntity
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorTemplateForObjectListByEntity",
          },
          orderBy: {
            type: "object",
            optional: true,
            definition: {
              attributeName: { type: "string" },
              direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
            },
          },
          filter: {
            type: "object",
            optional: true,
            definition: {
              attributeName: { type: "string" },
              value: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "transformerForBuildPlusRuntime",
                },
                context: {},
              },
            },
          },
        },
      },
      // // combinerByRelationReturningObjectList !!!!!!!!!!!!!!!!!!!!!!!!!!
      // {
      //   type: "object",
      //   extend: {
      //     type: "schemaReference",
      //     definition: {
      //       eager: true,
      //       relativePath: "extractorTemplateRoot",
      //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //     },
      //     context: {},
      //   },
      //   definition: {
      //     extractorTemplateType: {
      //       type: "literal",
      //       definition: "combinerByRelationReturningObjectList",
      //     },
      //     orderBy: {
      //       type: "object",
      //       optional: true,
      //       definition: {
      //         attributeName: { type: "string" },
      //         direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
      //       },
      //     },
      //     objectReference: {
      //       type: "schemaReference",
      //       definition: {
      //         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //         relativePath: "transformerForRuntime_InnerReference",
      //       },
      //       context: {},
      //     },
      //     objectReferenceAttribute: { type: "string", optional: true },
      //     AttributeOfListObjectToCompareToReferenceUuid: { type: "string" },
      //   },
      // },
      // // combinerByManyToManyRelationReturningObjectList !!!!!!!!!!!!!!!!!!!!!!!!!!
      // {
      //   type: "object",
      //   extend: {
      //     type: "schemaReference",
      //     definition: {
      //       eager: true,
      //       relativePath: "extractorTemplateRoot",
      //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //     },
      //     context: {},
      //   },
      //   definition: {
      //     extractorTemplateType: {
      //       type: "literal",
      //       definition: "combinerByManyToManyRelationReturningObjectList",
      //     },
      //     orderBy: {
      //       type: "object",
      //       optional: true,
      //       definition: {
      //         attributeName: { type: "string" },
      //         direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
      //       },
      //     },
      //     objectListReference: {
      //       type: "schemaReference",
      //       definition: {
      //         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //         relativePath: "transformerForRuntime_contextReference",
      //       },
      //       context: {},
      //     },
      //     objectListReferenceAttribute: { type: "string", optional: true },
      //     AttributeOfRootListObjectToCompareToListReferenceUuid: {
      //       type: "string",
      //       optional: true,
      //     },
      //   },
      // },
    ];

    const valueObject = {
      extractorTemplateType: "combinerByRelationReturningObjectList",
      parentName: "Book",
      parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      objectReference: {
        transformerType: "contextReference",
        interpolation: "runtime",
        referenceName: "author",
      },
      AttributeOfListObjectToCompareToReferenceUuid: "author",
    };

    const result = selectUnionBranchFromDiscriminator(
      unionObjectChoices,
      ["extractorTemplateType"],
      valueObject,
      [], // valueObjectPath
      [], // typePath
      defaultMetaModelEnvironment,
      {
      }
    );
    
    console.log("currentDiscriminatedObjectJzodSchema", JSON.stringify(result.status === "ok" ? result.currentDiscriminatedObjectJzodSchema : null, null, 2));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual({
      type: "object",
      definition: {
        label: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 1,
              defaultLabel: "Label",
              editable: false,
            },
          },
        },
        applicationSection: {
          type: "schemaReference",
          optional: true,
          tag: {
            value: {
              id: 2,
              defaultLabel: "SelfApplication Section",
              editable: false,
            },
          },
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "applicationSection",
          },
          context: {},
        },
        parentName: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 3,
              defaultLabel: "Parent Name",
              editable: false,
            },
          },
        },
        parentUuid: {
          type: "union",
          discriminator: "transformerType",
          tag: {
            value: {
              id: 4,
              defaultLabel: "Parent Uuid",
              editable: false,
            },
          },
          definition: [
            {
              type: "string",
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "transformerForBuild_InnerReference",
              },
              context: {},
            },
          ],
        },
        extractorTemplateType: {
          type: "literal",
          definition: "combinerByRelationReturningObjectList",
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
        objectReference: {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "transformerForRuntime_InnerReference",
          },
          context: {},
        },
        objectReferenceAttribute: {
          type: "string",
          optional: true,
        },
        AttributeOfListObjectToCompareToReferenceUuid: {
          type: "string",
        },
      }
    });
    }
  });

  // #################################################################################################
  it("returns the correct branch for a string that could be a transformer or a runtime transformer", () => {
    const unionObjectChoices: JzodObject[] = [
      // mustacheStringTemplate
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "mustacheStringTemplate" },
          definition: { type: "string" },
        },
      },
      // constant
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "constant" },
          value: { type: "any" },
        },
      },
      // parameterReference
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_optional_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", optional: true, definition: "build" },
          transformerType: { type: "literal", definition: "parameterReference" },
          referenceName: { optional: true, type: "string" },
          referencePath: { optional: true, type: "array", definition: { type: "string" } },
        },
      },
      // constantUuid
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "constantUuid" },
          value: { type: "string" },
        },
      },
      // constantObject
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "constantObject" },
          value: { type: "record", definition: { type: "any" } },
        },
      },
      // constantString
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "constantString" },
          value: { type: "string" },
        },
      },
      // newUuid
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "newUuid" },
        },
      },
      // newUuid  !!!!!!!!!!!!!
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "newUuid" },
        },
      },
      // objectDynamicAccess
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "objectDynamicAccess" },
          objectAccessPath: {
            type: "array",
            definition: {
              type: "union",
              discriminator: "transformerType",
              definition: [
                {
                  type: "object",
                  extend: [
                    {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        relativePath: "transformerForRuntime_optional_Abstract",
                      },
                      context: {},
                    },
                  ],
                  definition: {
                    interpolation: { type: "literal", optional: true, definition: "runtime" },
                    transformerType: { type: "literal", definition: "contextReference" },
                    referenceName: { optional: true, type: "string" },
                    referencePath: {
                      optional: true,
                      type: "array",
                      definition: { type: "string" },
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
                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        relativePath: "transformerForRuntime_Abstract",
                      },
                      context: {},
                    },
                  ],
                  definition: {
                    interpolation: { type: "literal", definition: "runtime" },
                    transformerType: { type: "literal", definition: "objectDynamicAccess" },
                    objectAccessPath: {
                      type: "array",
                      definition: {
                        type: "union",
                        discriminator: "transformerType",
                        definition: [
                          {
                            type: "object",
                            extend: [
                              {
                                type: "schemaReference",
                                definition: {
                                  eager: true,
                                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  relativePath: "transformerForRuntime_optional_Abstract",
                                },
                                context: {},
                              },
                            ],
                            definition: {
                              transformerType: { type: "literal", definition: "contextReference" },
                              referenceName: { optional: true, type: "string" },
                              referencePath: {
                                optional: true,
                                type: "array",
                                definition: { type: "string" },
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
                                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  relativePath: "transformerForRuntime_Abstract",
                                },
                                context: {},
                              },
                            ],
                            definition: {
                              transformerType: {
                                type: "literal",
                                definition: "objectDynamicAccess",
                              },
                              objectAccessPath: {
                                type: "array",
                                definition: {
                                  type: "union",
                                  discriminator: "transformerType",
                                  definition: [
                                    {
                                      type: "schemaReference",
                                      definition: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath:
                                          "transformerForBuildPlusRuntime_contextReference",
                                      },
                                    },
                                    {
                                      type: "schemaReference",
                                      definition: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath:
                                          "transformerForBuildPlusRuntime_objectDynamicAccess",
                                      },
                                    },
                                    {
                                      type: "schemaReference",
                                      definition: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath:
                                          "transformerForBuildPlusRuntime_mustacheStringTemplate",
                                      },
                                    },
                                    { type: "string" },
                                  ],
                                },
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
                                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  relativePath: "transformerForRuntime_Abstract",
                                },
                                context: {},
                              },
                            ],
                            definition: {
                              transformerType: {
                                type: "literal",
                                definition: "mustacheStringTemplate",
                              },
                              definition: { type: "string" },
                            },
                          },
                          { type: "string" },
                        ],
                      },
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
                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        relativePath: "transformerForBuild_Abstract",
                      },
                      context: {},
                    },
                  ],
                  definition: {
                    interpolation: { type: "literal", definition: "build" },
                    transformerType: { type: "literal", definition: "mustacheStringTemplate" },
                    definition: { type: "string" },
                  },
                },
                { type: "string" },
              ],
            },
          },
        },
      },
    ];
    });

  // ##################################################################################################
  it("returns the correct branch for an object without any discriminator values when exactly 1 branch without any discriminator values exists in the discriminated union", () => {
    const unionObjectChoices: JzodObject[] = [
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "branchWithoutDiscriminator",
          },
          someProperty: { type: "string" },
        },
      },
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "branchWithDiscriminator",
          },
          discriminator: { type: "string" },
        },
      },
    ];

    const valueObject = {
      someProperty: "testValue",
    };

    const result = selectUnionBranchFromDiscriminator(
      unionObjectChoices,
      [], // no discriminator keys
      valueObject,
      [], // valueObjectPath
      [], // typePath
      defaultMetaModelEnvironment,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual({
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "branchWithoutDiscriminator",
          },
          someProperty: { type: "string" },
        },
      });
    }
  });

});