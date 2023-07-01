import ts from 'typescript';
import { ZodType, ZodTypeAny, z } from "zod";


export type ResTypeForTs = {schemas:{[k:string]:ZodType}, references:{[k:string]:ZodType}};
// export type ResType = {[k:string]:ZodType};
// export type ResType = {[k:string]:{zodSchema:ZodTypeAny, description:string}};
export interface ZodSchemaAndDescription {zodSchema:ZodTypeAny, description:string};

export type ResType = {[k:string]:ZodSchemaAndDescription};

// type RequiredZodToTsOptions = Required<ZodToTsOptions>; //from zod-to-ts
type TsType = typeof ts;
// type ZodToTsGetTypeFunction = (typescript: typeof ts, identifier: string, options: RequiredZodToTsOptions) => ts.Identifier | ts.TypeNode;//from zod-to-ts

export const ZodRootSchema = z.object({
  optional: z.boolean().optional(),
});
export type ZodRoot = z.infer<typeof ZodRootSchema>;

// export const ZodSimpleTypeSchema = z.enum([
//   'any',
//   'boolean',
//   'string',
//   'number',
// ]);
// export type ZodSimpleType = z.infer<typeof ZodSimpleTypeSchema>;

// ##############################################################################################################
export interface ZodSimpleAttribute extends ZodRoot {
  type: "simpleType",
  definition: 'any' | 'boolean' | 'string' | 'number'
}

export const ZodSimpleAttributeSchema: z.ZodType<ZodSimpleAttribute> = z.object({
  optional: z.boolean().optional(),
  type: z.literal('simpleType'),
  definition: z.enum([
    'any',
    'boolean',
    'string',
    'number',
  ])
})

// ##############################################################################################################
export const ZodEnumSchema = z.object({
  type: z.literal("enum"),
  definition: z.array(z.string()),
})

export type ZodEnum = z.infer<typeof ZodEnumSchema>;

// ##############################################################################################################
export const ZodLiteralSchema = z.object({
  type: z.literal("literal"),
  definition: z.string(),
})

export type ZodLiteral = z.infer<typeof ZodLiteralSchema>;

// ##############################################################################################################
export interface ZodFunction {
  type: "function",
  args: ZodSimpleAttribute[],
  returns?: ZodSimpleAttribute,
  // implements: (...args:any[])=>any,
}

export const ZodFunctionSchema = z.object({
  type: z.literal("function"),
  // anyway, arg and returns types are not use upon validation to check the function's interface. Suffices for it to be a function, it is then valid.
  args:z.array(ZodSimpleAttributeSchema),
  returns: ZodSimpleAttributeSchema.optional(),
})

// ##############################################################################################################
export const ZodLazySchema = z.object({
  type: z.literal("lazy"),
  definition: ZodFunctionSchema,
})

export type ZodLazy = z.infer<typeof ZodLazySchema>;

// ##############################################################################################################
// export const ZodReferentialCoreElementSchema = ZodRootSchema.extend({
export const ZodReferentialCoreElementSchema = z.object({ // inheritance from ZodRootSchema leads to a different JsonSchema thus invalidates tests, although it is semantically equivalent
  optional: z.boolean().optional(),
  type: z.literal("schemaReference"),
  definition: z.string()
})

export type ZodReferentialCoreElement = z.infer<typeof ZodReferentialCoreElementSchema>;

// ##############################################################################################################
export type ZodSimpleElement =
  // | ZodRoot
  | ZodEnum
  | ZodFunction
  | ZodLazy
  | ZodLiteral
  | ZodSimpleAttribute
  // | ZodSimpleArray
  | ZodSimpleBootstrapElement
  // | ZodSimpleObject
  // | ZodSimpleRecord
  // | ZodSimpleUnion
;

export const ZodSimpleElementSchema: z.ZodType<ZodSimpleElement> = z.union([
  z.lazy(()=>ZodEnumSchema),
  z.lazy(()=>ZodFunctionSchema),
  z.lazy(()=>ZodLazySchema),
  z.lazy(()=>ZodLiteralSchema),
  z.lazy(()=>ZodSimpleAttributeSchema),
  // z.lazy(()=>ZodSimpleArraySchema),
  z.lazy(()=>ZodSimpleBootstrapElementSchema),
  // z.lazy(()=>ZodSimpleObjectSchema),
  // z.lazy(()=>ZodSimpleRecordSchema),
  // z.lazy(()=>ZodSimpleUnionSchema),
])

// ##############################################################################################################
export interface ZodRecord {
  type: 'record',
  // definition: ZodSimpleElement[],
  definition: ZodReferentialElement,
}

export const ZodRecordSchema: z.ZodType<ZodRecord> = z.object({
  type: z.literal('record'),
  definition: z.lazy(()=>ZodReferentialElementSchema)
  // definition: withGetType(z.lazy(() => ZodSimpleElementSchema),(ts:TsType) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema")))
})


// ##############################################################################################################
export type ZodReferentialElement =
| ZodSimpleElement
| ZodRecord
| ZodObjectWithReferential
| ZodReferentialCoreElement
| ZodReferentialElementArray
| ZodReferentialUnion
;

export const ZodReferentialElementSchema: z.ZodType<ZodReferentialElement> = z.union([
  z.lazy(()=>ZodSimpleElementSchema),
  z.lazy(()=>ZodRecordSchema),
  z.lazy(()=>ZodObjectWithReferentialSchema),
  z.lazy(()=>ZodReferentialCoreElementSchema),
  z.lazy(()=>ZodReferentialElementArraySchema),
  z.lazy(()=>ZodReferentialUnionSchema),
])

// ##############################################################################################################
export const ZodReferentialElementSetSchema = z.record(z.string(),ZodReferentialElementSchema);
export type ZodReferentialElementSet = z.infer<typeof ZodReferentialElementSetSchema>;


// ##############################################################################################################
// export interface ZodSimpleUnion {
//   type: "simpleUnion",
//   definition: ZodSimpleElement[],
// }
// export const ZodSimpleUnionSchema: z.ZodType<ZodSimpleUnion> = z.object({
//   type: z.literal("simpleUnion"),
//   // definition: z.array(ZodSimpleObjectSchema)
//   // definition: z.lazy(()=>z.array(ZodSimpleObjectSchema))
//   definition: z.lazy(()=>z.array(ZodSimpleObjectSchema))
//   // definition: withGetType(
//   //   z.lazy(
//   //     () => z.array(ZodSimpleElementSchema)),
//   //     (ts:TsType) => ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema"))))
// });

  // ##############################################################################################################
export interface ZodReferentialUnion {
  type: "referentialUnion",
  definition: ZodReferentialElement[],
}
export const ZodReferentialUnionSchema: z.ZodType<ZodReferentialUnion> = z.object({
  type: z.literal("referentialUnion"),
  definition: z.lazy(()=>z.array(ZodReferentialElementSchema))
  // definition: withGetType(
  //   z.lazy(
  //     () => z.array(ZodReferentialElementSchema)),
  //     (ts:TsType) => ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodReferentialElementSchema"))))
});
// ))
// })
// export const ZodSimpleUnionSchema = z.object({
//   type: z.literal("union"),
//   // definition: ZodFunctionSchema,
//   definition: z.array(), // TODO:keep Schemas clean!!!
// })
// export type ZodUnion = z.infer<typeof ZodUnionSchema>;


// ##############################################################################################################
export const ZodSimpleBootstrapElementSchema = z.object({
  type: z.literal("simpleBootstrapElement"),
})

export type ZodSimpleBootstrapElement = z.infer<typeof ZodSimpleBootstrapElementSchema>;

// ##############################################################################################################
// export interface ZodSimpleObject extends ZodRoot {
//   type: 'object',
//   definition: {[attributeName:string]:ZodSimpleElement},
//   extend?: ZodSimpleObject,
// }

export interface ZodObjectWithReferential extends ZodRoot {
  type: 'object',
  definition: {[attributeName:string]: ZodReferentialElement}
  // extend?: ZodSimpleObject | ZodReferentialCoreElement,
}

// // export const ZodSimpleObjectSchema: z.ZodType<ZodSimpleObject> = ZodRootSchema.extend({
// export const ZodSimpleObjectSchema: z.ZodType<ZodSimpleObject> = z.object({ // issue with JsonSchema conversion when using extend from ZodRootSchema, although the 2 are functionnaly equivalent
//   optional: z.boolean().optional(),
//   type: z.literal('object'),
//   // extend: z.string().optional(),
//   // extend: ZodSimpleObjectSchema.optional(),
//   // definition: z.record(z.string(),withGetType(z.lazy(() => ZodSimpleElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema"))))
//   definition: z.lazy(()=>z.record(z.string(),ZodSimpleElementSchema))
// })

// export const ZodObjectWithReferentialSchema: z.ZodType<ZodObjectWithReferential> = ZodRootSchema.extend({
export const ZodObjectWithReferentialSchema: z.ZodType<ZodObjectWithReferential> = z.object({
  optional: z.boolean().optional(),
  type: z.literal('object'),
  // extend: z.string().optional(),
  // extend: ZodReferentialCoreElementSchema.optional(),
  // extend: z.union([ZodSimpleObjectSchema,ZodReferentialCoreElementSchema]).optional(), // TODO: enable 'extend' clause! (get rid of zod-to-ts?)
  // definition: withGetType(z.lazy(() => ZodReferentialElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodReferentialElementSchema"))),
  definition: z.lazy(()=>z.record(z.string(),ZodReferentialElementSchema)),
})

// ##############################################################################################################
// export interface ZodSimpleArray extends ZodRoot {
//   type: 'simpleArray',
//   definition: ZodSimpleElement
// }
// // export const ZodSimpleArraySchema: z.ZodType<ZodSimpleArray> = ZodRootSchema.extend({
// export const ZodSimpleArraySchema: z.ZodType<ZodSimpleArray> = z.object({ // issue with JsonSchema conversion when using extend from ZodRootSchema, although the 2 are functionnaly equivalent
//   optional: z.boolean().optional(),
//   type: z.literal('simpleArray'),
//   definition: z.lazy(()=>ZodSimpleElementSchema)
//   // definition: withGetType(z.lazy(() => ZodSimpleElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema"))), // TODO:keep Schemas clean!!!
// });

export interface ZodReferentialElementArray extends ZodRoot {
  type: 'array',
  definition: ZodReferentialElement
}
// export const ZodReferentialElementArraySchema: z.ZodType<ZodReferentialElementArray> = ZodRootSchema.extend({
export const ZodReferentialElementArraySchema: z.ZodType<ZodReferentialElementArray> = z.object({ // issue with JsonSchema conversion when using extend from ZodRootSchema, although the 2 are functionnaly equivalent
  optional: z.boolean().optional(),
  type: z.literal('array'),
  definition: z.lazy(()=>ZodReferentialElementSchema)
})

// ##############################################################################################################

export const zodJsonBootstrapSchema: ZodReferentialElementSet = {
  // ZodRootSchema: {
  //   type: "object",
  //   definition: { optional: { type: "simpleType", definition: "boolean", optional: true } },
  // },
  ZodEnumSchema: {
    type: "object",
    definition: {
      "type": { type: "literal", definition: "enum" },
      "definition": { type: "array", definition: { type: "simpleType", definition: "string" } },
    },
  },
  ZodFunctionSchema: {
    type: "object",
    definition: {
      type: { type: "literal", definition: "function" },
      args: {
        type: "array",
        definition: { type: "schemaReference", definition: "ZodSimpleAttributeSchema" },
      },
      returns: { type: "schemaReference", definition: "ZodSimpleAttributeSchema", optional: true },
    },
  },
  ZodLazySchema: {
    type: "object",
    definition: {
      type: { type: "literal", definition: "lazy" },
      definition: { type: "schemaReference", definition: "ZodFunctionSchema" },
    },
  },
  ZodLiteralSchema: {
    type: "object",
    definition: {
      "type": { type: "literal", definition: "literal" },
      "definition": { type: "simpleType", definition: "string" },
    },
  },
  ZodReferentialCoreElementSchema: {
    type: "object",
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "referentialElement" },
      "definition": { type: "simpleType", definition: "string" },
    },
  },
  // // ZodSimpleRecordSchema: {
  // //   type: "object",
  // //   definition: {
  // //     type: { type: "literal", definition: "record" },
  // //     // definition: { type: "simpleBootstrapElement" },
  // //     definition: { type: "referentialElement", definition: "ZodSimpleElementSchema" },
  // //   },
  // // },
  // // ZodSimpleUnionSchema: {
  // //   type: "object",
  // //   definition: {
  // //     // "optional": { type: "simpleType", definition: "boolean", optional: true },
  // //     type: { type: "literal", definition: "simpleUnion" },
  // //     definition: {
  // //       type: "simpleArray",
  // //       // definition: { type: "referentialElement", definition: "ZodLiteralSchema" },
  // //       definition: { type: "referentialElement", definition: "ZodSimpleElementSchema" },
  // //     },
  // //   },
  // // },
  // // ZodReferentialUnionSchema: {
  // //   type: "object",
  // //   definition: {
  // //     // "optional": { type: "simpleType", definition: "boolean", optional: true },
  // //     "type": { type: "literal", definition: "referentialUnion" },
  // //     "definition": {
  // //       type: "simpleArray",
  // //       // definition: { type: "referentialElement", definition: "ZodLiteralSchema" },
  // //       definition: { type: "referentialElement", definition: "ZodReferentialElementSchema" },
  // //     },
  // //   },
  // // },
  // // // ZodReferentialObjectSchema: {
  // // //   type: "object",
  // // //   definition: {
  // // //     "optional": { type: "simpleType", definition: "boolean", optional: true },
  // // //     "type": { type: "literal", definition: "object" },
  // // //     "definition": {
  // // //       type: "record",
  // // //       definition: { type: "simpleBootstrapElement" },
  // // //     },
  // // //   },
  // // // },
  // // // ZodObjectWithReferentialSchema: {
  // // //   type: "object",
  // // //   definition: {
  // // //     "optional": { type: "simpleType", definition: "boolean", optional: true },
  // // //     type: { type: "literal", definition: "object" },
  // // //     definition: {
  // // //       type: "referentialUnion",
  // // //       // definition: { type: "referentialElement", definition: "ZodLiteralSchema" },
  // // //       definition: { type: "referentialElement", definition: "ZodSimpleElementSchema" },
  // // //     },
  // // //   },
  // // // },
  ZodSimpleAttributeSchema: {
    type: "object",
    // extend: {type:"referentialElement", definition:"ZodRootSchema"},
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "simpleType" },
      "definition": { type: "enum", definition: ['any','boolean','string','number',] },
    },
  },
  ZodSimpleArraySchema: { // before ZodSimpleElementSchema
    type: "object",
    // extend: {type:"referentialElement", definition:"ZodRootSchema"},
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "simpleArray" },
      // "definition": { type: "referentialElement", definition: "ZodSimpleAttributeSchema" },
      "definition": { type: "schemaReference", definition: "ZodSimpleElementSchema" },
    },
  },
  ZodSimpleElementSchema: {
    type: "referentialUnion",
    definition: [
      { type: "schemaReference", definition: "ZodEnumSchema"},
      { type: "schemaReference", definition: "ZodFunctionSchema"},
      { type: "schemaReference", definition: "ZodLazySchema"},
      { type: "schemaReference", definition: "ZodLiteralSchema"},
      { type: "schemaReference", definition: "ZodSimpleAttributeSchema"},
      { type: "schemaReference", definition: "ZodSimpleArraySchema"},
      { type: "schemaReference", definition: "ZodSimpleBootstrapElementSchema"},
      { type: "schemaReference", definition: "ZodSimpleObjectSchema"},
      // { type: "referentialElement", definition: "ZodSimpleRecordSchema"},
      // { type: "referentialElement", definition: "ZodSimpleUnionSchema"},
      // { type: "referentialElement", definition: "ZodRootSchema"},
    ]
  },
  ZodSimpleBootstrapElementSchema: { type: "simpleBootstrapElement" }, // must be after ZodSimpleElementSchema, and before ZodSimpleObjectSchema
  ZodSimpleObjectSchema: {
    type: "object",
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "object" },
      "definition": {
        type: "record",
        definition: { type: "simpleBootstrapElement" },
      },
    },
  },
  ZodReferentialElementSchema: {
    type: "referentialUnion",
    definition: [
      { type: "schemaReference", definition: "ZodSimpleElementSchema" },
      { type: "schemaReference", definition: "ZodReferentialCoreElementSchema" },
    ]
  },
  // // ZodSimpleObjectSchema: {
  // //   type: "object",
  // //   definition: {
  // //     "optional": { type: "simpleType", definition: "boolean", optional: true },
  // //     type: { type: "literal", definition: "object" },
  // //     definition: { type: "simpleType", definition: "string" },
  // //   },
  // // },
  // // ZodSimpleElementSchema:
};
