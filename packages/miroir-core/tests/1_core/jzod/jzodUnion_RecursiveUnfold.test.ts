import { describe, expect, it } from "vitest";


import { miroirFundamentalJzodSchema } from '../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema';
// import entityDefinitionEntityDefinition from "../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import entityDefinitionEntityDefinition from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import entityDefinitionBook from "../../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";

import {
  JzodElement,
  JzodReference,
  JzodSchema,
  JzodUnion,
  MetaModel,
  type JzodUnion_RecursivelyUnfold_ReturnTypeError,
  type JzodUnion_RecursivelyUnfold_ReturnTypeOK
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  jzodUnion_recursivelyUnfold,
} from "../../../src/1_core/jzod/jzodUnion_RecursivelyUnfold";
import currentMiroirModel from "../currentMiroirModel.json";
import currentModel from "../currentModel.json";
import { unfoldJzodSchemaOnce } from "../../../src/1_core/jzod/JzodUnfoldSchemaOnce";
import { entity } from "../../../dist";
import { defaultMiroirMetaModel } from "../../test_assets/defaultMiroirMetaModel";
import { defaultMetaModelEnvironment } from "../../../src/1_core/Model";

const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as JzodSchema;

function local_jzodUnion_recursivelyUnfold(
  schema: JzodUnion,
  relativeReferenceJzodContext: { [k: string]: JzodElement } = {}
): JzodUnion_RecursivelyUnfold_ReturnTypeOK | JzodUnion_RecursivelyUnfold_ReturnTypeError {
  // TODO: test on schemaReference which unfold to unions
  // const unfoldedSchema = unfoldJzodSchemaOnce(
  //   miroirFundamentalJzodSchema as JzodSchema, // context.miroirFundamentalJzodSchema,
  //   schema,
  //   currentModel as any as MetaModel,
  //   currentMiroirModel as any as MetaModel
  // );
  // if (unfoldedSchema.status === "error") {
  //   throw new Error(`Error while unfolding JzodUnion: ${unfoldedSchema.error}`);
  // }
  return jzodUnion_recursivelyUnfold(
    schema,
    // unfoldedSchema as JzodUnion,
    new Set(),
    defaultMetaModelEnvironment,
    // castMiroirFundamentalJzodSchema,
    // currentModel as any as MetaModel,
    // currentMiroirModel as any as MetaModel,
    relativeReferenceJzodContext
  );
}

describe("jzodUnion_RecursiveUnfold", () => {
  it("jzodUnion_RecursiveUnfold returns basic types at the root of the union", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema);

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(),
    });
  });

  it("jzodUnion_RecursiveUnfold returns basic types in sub-unions", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        {
          type: "union",
          definition: [
            { type: "string" },
            { type: "boolean" },
            { type: "null" },
          ],
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema);

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(),
    });
  });

  it("jzodUnion_RecursiveUnfold returns reference definitions for references present at the root of the union", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        { type: "schemaReference", definition: { relativePath: "MyReference"} },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {MyReference: { type: "string" }});

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold returns reference definitions for references present in sub-unions", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        {
          type: "union",
          definition: [
            { type: "string" },
            { type: "schemaReference", definition: { relativePath: "MyReference"} },
          ],
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {MyReference: { type: "boolean" }});

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold returns reference definitions for references present in sub-unions with multiple levels", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        {
          type: "union",
          definition: [
            { type: "string" },
            {
              type: "union",
              definition: [
                { type: "schemaReference", definition: { relativePath: "MyReference"} },
                { type: "boolean" },
              ],
            },
          ],
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {MyReference: { type: "null" }});

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold expand a reference definition when reference is itself a union", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        {
          type: "schemaReference",
          definition: {
            relativePath: "MyReference",
          },
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {
      "MyReference": {
        type: "union",
        definition: [
          { type: "string" },
          { type: "boolean" },
        ],
      }
    });

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold returns error when reference is not found in context", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        { type: "schemaReference", definition: { relativePath: "MyReference"} },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema);

    expect(result.status).toBe("error");
    expect((result as JzodUnion_RecursivelyUnfold_ReturnTypeError).error).toMatch(/^Error while recursively unfolding JzodUnion/);
  });

  it("jzodUnion_RecursiveUnfold expand a reference definition with discriminator when reference is itself a union with discriminator", () => {
    const schema: JzodUnion = {
      type: "union",
      discriminator: "myObjectType",
      definition: [
        { type: "number" },
        {
          type: "object",
          definition: {
            myObjectType: { type: "literal", definition: "A" },
          },
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "MyReference",
          },
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {
      "MyReference": {
        type: "union",
        discriminator: "myObjectType",
        definition: [
          { type: "object", definition: { myObjectType: { type: "literal", definition: "B" } } },
          { type: "object", definition: { myObjectType: { type: "literal", definition: "C" } } },
        ],
      }
    });

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "object", definition: { myObjectType: { type: "literal", definition: "A"}} },
        { type: "object", definition: { myObjectType: { type: "literal", definition: "B"}} },
        { type: "object", definition: { myObjectType: { type: "literal", definition: "C"}} },
      ],
      discriminator: "myObjectType",
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold expands the jzodElement definition", () => {
    const schema: JzodUnion = {
      type: "union",
      discriminator: "type",
      definition: [
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodArray",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodPlainAttribute",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodAttributePlainDateWithValidations",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodAttributePlainNumberWithValidations",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodAttributePlainStringWithValidations",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodEnum",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodFunction",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodLazy",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodLiteral",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodIntersection",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodMap",
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
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodPromise",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodRecord",
          },
          context: {},
        },
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
            relativePath: "jzodSet",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodTuple",
          },
          context: {},
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodUnion",
          },
          context: {},
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {
      // "MyReference": {
      //   type: "object",
      //   definition: {
      //     myObjectType: { type: "literal", definition: "B" },
      //   }
      // }
    });

    console.log(expect.getState().currentTestName, "result", JSON.stringify(result, null, 2));
    expect(result).toEqual({
      status: "ok",
      result: [
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "array",
            },
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
              context: {},
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "enum",
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
            coerce: {
              type: "boolean",
              optional: true,
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "date",
            },
            coerce: {
              type: "boolean",
              optional: true,
            },
            validations: {
              type: "array",
              optional: true,
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodAttributeDateValidations",
                },
                context: {},
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "number",
            },
            coerce: {
              type: "boolean",
              optional: true,
            },
            validations: {
              type: "array",
              optional: true,
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodAttributeNumberValidations",
                },
                context: {},
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "string",
            },
            coerce: {
              type: "boolean",
              optional: true,
            },
            validations: {
              type: "array",
              optional: true,
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodAttributeStringValidations",
                },
                context: {},
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "enum",
            },
            definition: {
              type: "array",
              definition: {
                type: "string",
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "function",
            },
            definition: {
              type: "object",
              definition: {
                args: {
                  type: "array",
                  definition: {
                    type: "schemaReference",
                    definition: {
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      relativePath: "jzodElement",
                    },
                    context: {},
                  },
                },
                returns: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "jzodElement",
                  },
                  optional: true,
                  context: {},
                },
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "lazy",
            },
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodFunction",
              },
              context: {},
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
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
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "intersection",
            },
            definition: {
              type: "object",
              definition: {
                left: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "jzodElement",
                  },
                  context: {},
                },
                right: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "jzodElement",
                  },
                  context: {},
                },
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "map",
            },
            definition: {
              type: "tuple",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "jzodElement",
                  },
                  context: {},
                },
                {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "jzodElement",
                  },
                  context: {},
                },
              ],
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          tag: {
            value: {
              unfoldSubLevels: 2,
            },
          },
          definition: {
            extend: {
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
            type: {
              type: "literal",
              definition: "object",
            },
            nonStrict: {
              type: "boolean",
              optional: true,
            },
            partial: {
              type: "boolean",
              optional: true,
            },
            definition: {
              type: "record",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                context: {},
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "promise",
            },
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
              context: {},
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "record",
            },
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
              context: {},
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "schemaReference",
            },
            context: {
              type: "record",
              optional: true,
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                context: {},
              },
            },
            definition: {
              type: "object",
              definition: {
                eager: {
                  type: "boolean",
                  optional: true,
                },
                partial: {
                  type: "boolean",
                  optional: true,
                },
                relativePath: {
                  type: "string",
                },
                absolutePath: {
                  type: "string",
                  optional: true,
                },
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "set",
            },
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
              context: {},
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "tuple",
            },
            definition: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                context: {},
              },
            },
          },
        },
        {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodBaseObject",
            },
            context: {},
          },
          definition: {
            type: {
              type: "literal",
              definition: "union",
            },
            discriminator: {
              type: "union",
              optional: true,
              definition: [
                {
                  type: "string",
                },
                {
                  type: "array",
                  definition: {
                    type: "string",
                  },
                },
              ],
            },
            discriminatorNew: {
              type: "union",
              optional: true,
              definition: [
                {
                  type: "object",
                  definition: {
                    discriminatorType: {
                      type: "literal",
                      definition: "string",
                    },
                    value: {
                      type: "string",
                    },
                  },
                },
                {
                  type: "object",
                  definition: {
                    discriminatorType: {
                      type: "literal",
                      definition: "array",
                    },
                    value: {
                      type: "array",
                      definition: {
                        type: "string",
                      },
                    },
                  },
                },
              ],
            },
            definition: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                context: {},
              },
            },
          },
        },
      ],
      expandedReferences: new Set([
        "jzodArray",
        "jzodPlainAttribute",
        "jzodAttributePlainDateWithValidations",
        "jzodAttributePlainNumberWithValidations",
        "jzodAttributePlainStringWithValidations",
        "jzodEnum",
        "jzodFunction",
        "jzodLazy",
        "jzodLiteral",
        "jzodIntersection",
        "jzodMap",
        "jzodObject",
        "jzodPromise",
        "jzodRecord",
        "jzodReference",
        "jzodSet",
        "jzodTuple",
        "jzodUnion",
      ]),
      discriminator: "type",
    });
  });

  it("jzodUnion_RecursiveUnfold should handle circular references without infinite recursion", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "string" },
        {
          type: "schemaReference",
          definition: { relativePath: "CircularRef" },
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {
      CircularRef: {
        type: "union",
        definition: [
          { type: "number" },
          {
            type: "schemaReference",
            definition: { relativePath: "CircularRef" }, // References itself
          },
        ],
      },
    });

    console.log(expect.getState().currentTestName, "result", JSON.stringify(result, null, 2));

    // This should not cause infinite recursion
    expect(result.status).toBe("ok");
    expect((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).result).toEqual([
      {
        type: "string",
      },
      {
        type: "number",
      },
    ]);
    // expect((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).result).toContain({ type: "number" });
    expect(Array.from((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).expandedReferences)).toEqual(["CircularRef"]);
  });


  it("jzodUnion_RecursiveUnfold should handle nested circular references without infinite recursion", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "string" },
        {
          type: "union",
          definition: [
            { type: "number" },
            {
              type: "schemaReference",
              definition: { relativePath: "CircularRefA" },
            },
          ],
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {
      CircularRefA: {
        type: "union",
        definition: [
          { type: "boolean" },
          {
            type: "schemaReference",
            definition: { relativePath: "CircularRefB" },
          },
        ],
      },
      CircularRefB: {
        type: "union",
        definition: [
          { type: "null" },
          {
            type: "schemaReference",
            definition: { relativePath: "CircularRefA" }, // Back to A
          },
        ],
      },
    });

    console.log(expect.getState().currentTestName, "result", JSON.stringify(result, null, 2));

    // This should not cause infinite recursion
    expect(result.status).toBe("ok");
    expect((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).result).toEqual([
      { type: "string" },
      { type: "number" },
      { type: "boolean" },
      { type: "null" },
    ]);
    expect(
      Array.from((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).expandedReferences)
    ).toEqual(["CircularRefA", "CircularRefB"]);
  });

  it("jzodUnion_RecursiveUnfold should handle deeply nested circular references without infinite recursion", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "string" },
        {
          type: "union",
          definition: [
            { type: "number" },
            {
              type: "schemaReference",
              definition: { relativePath: "CircularRefA" },
            },
          ],
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {
      CircularRefA: {
        type: "union",
        definition: [
          { type: "boolean" },
          {
            type: "schemaReference",
            definition: { relativePath: "CircularRefB" },
          },
        ],
      },
      CircularRefB: {
        type: "union",
        definition: [
          { type: "null" },
          {
            type: "schemaReference",
            definition: { relativePath: "CircularRefC" },
          },
        ],
      },
      CircularRefC: {
        type: "union",
        definition: [
          { type: "undefined" },
          {
            type: "schemaReference",
            definition: { relativePath: "CircularRefA" }, // Back to A
          },
        ],
      },
    });

    console.log(expect.getState().currentTestName, "result", JSON.stringify(result, null, 2));

    // This should not cause infinite recursion
    expect(result.status).toBe("ok");
    expect((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).result).toEqual([
      { type: "string" },
      { type: "number" },
      { type: "boolean" },
      { type: "null" },
      { type: "undefined" },
    ]);
    expect(
      Array.from((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).expandedReferences)
    ).toEqual(["CircularRefA", "CircularRefB", "CircularRefC"]);
  });

  // ##############################################################################################
  it("jzodUnion_RecursiveUnfold should handle jzodElement jzod schema definition without infinite recursion", () => {
    const jzodElementSchema: JzodUnion = (castMiroirFundamentalJzodSchema as any).definition.context.jzodElement;

    const result = local_jzodUnion_recursivelyUnfold(jzodElementSchema, {
      // EntityDefinition: {
      //   type: "union",
      //   definition: [
      //     { type: "number" },
      //     {
      //       type: "schemaReference",
      //       definition: { relativePath: "EntityDefinition" }, // References itself
      //     },
      //   ],
      // },
    });

    if (result.status !== "ok") {
      throw new Error("Failed to unfold jzodElementSchema");
    }

    console.log(expect.getState().currentTestName, "result", JSON.stringify(result, null, 2));
    console.log(
      expect.getState().currentTestName,
      "result.expandedReferences",
      JSON.stringify(Array.from(result.expandedReferences), null, 2)
    );

    // This should not cause infinite recursion
    expect(result.status).toBe("ok");
    expect((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).result).toEqual([
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "array",
          },
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodElement",
            },
            context: {},
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "enum",
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
          coerce: {
            type: "boolean",
            optional: true,
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "date",
          },
          coerce: {
            type: "boolean",
            optional: true,
          },
          validations: {
            type: "array",
            optional: true,
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodAttributeDateValidations",
              },
              context: {},
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "number",
          },
          coerce: {
            type: "boolean",
            optional: true,
          },
          validations: {
            type: "array",
            optional: true,
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodAttributeNumberValidations",
              },
              context: {},
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "string",
          },
          coerce: {
            type: "boolean",
            optional: true,
          },
          validations: {
            type: "array",
            optional: true,
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodAttributeStringValidations",
              },
              context: {},
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "enum",
          },
          definition: {
            type: "array",
            definition: {
              type: "string",
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "function",
          },
          definition: {
            type: "object",
            definition: {
              args: {
                type: "array",
                definition: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    relativePath: "jzodElement",
                  },
                  context: {},
                },
              },
              returns: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                optional: true,
                context: {},
              },
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "lazy",
          },
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodFunction",
            },
            context: {},
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
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
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "intersection",
          },
          definition: {
            type: "object",
            definition: {
              left: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                context: {},
              },
              right: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                context: {},
              },
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "map",
          },
          definition: {
            type: "tuple",
            definition: [
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                context: {},
              },
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "jzodElement",
                },
                context: {},
              },
            ],
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        tag: {
          value: {
            unfoldSubLevels: 2,
          },
        },
        definition: {
          extend: {
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
          type: {
            type: "literal",
            definition: "object",
          },
          nonStrict: {
            type: "boolean",
            optional: true,
          },
          partial: {
            type: "boolean",
            optional: true,
          },
          definition: {
            type: "record",
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
              context: {},
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "promise",
          },
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodElement",
            },
            context: {},
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "record",
          },
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodElement",
            },
            context: {},
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "schemaReference",
          },
          context: {
            type: "record",
            optional: true,
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
              context: {},
            },
          },
          definition: {
            type: "object",
            definition: {
              eager: {
                type: "boolean",
                optional: true,
              },
              partial: {
                type: "boolean",
                optional: true,
              },
              relativePath: {
                type: "string",
              },
              absolutePath: {
                type: "string",
                optional: true,
              },
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "set",
          },
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodElement",
            },
            context: {},
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "tuple",
          },
          definition: {
            type: "array",
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
              context: {},
            },
          },
        },
      },
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodBaseObject",
          },
          context: {},
        },
        definition: {
          type: {
            type: "literal",
            definition: "union",
          },
          discriminator: {
            type: "union",
            optional: true,
            definition: [
              {
                type: "string",
              },
              {
                type: "array",
                definition: {
                  type: "string",
                },
              },
            ],
          },
          discriminatorNew: {
            type: "union",
            optional: true,
            definition: [
              {
                type: "object",
                definition: {
                  discriminatorType: {
                    type: "literal",
                    definition: "string",
                  },
                  value: {
                    type: "string",
                  },
                },
              },
              {
                type: "object",
                definition: {
                  discriminatorType: {
                    type: "literal",
                    definition: "array",
                  },
                  value: {
                    type: "array",
                    definition: {
                      type: "string",
                    },
                  },
                },
              },
            ],
          },
          definition: {
            type: "array",
            definition: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "jzodElement",
              },
              context: {},
            },
          },
        },
      },
    ]);
    expect(
      Array.from((result as JzodUnion_RecursivelyUnfold_ReturnTypeOK).expandedReferences)
    ).toEqual([
      "jzodArray",
      "jzodPlainAttribute",
      "jzodAttributePlainDateWithValidations",
      "jzodAttributePlainNumberWithValidations",
      "jzodAttributePlainStringWithValidations",
      "jzodEnum",
      "jzodFunction",
      "jzodLazy",
      "jzodLiteral",
      "jzodIntersection",
      "jzodMap",
      "jzodObject",
      "jzodPromise",
      "jzodRecord",
      "jzodReference",
      "jzodSet",
      "jzodTuple",
      "jzodUnion",
    ]);
  });

});
