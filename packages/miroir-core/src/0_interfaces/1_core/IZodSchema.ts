import ts from 'typescript';
import { ZodType, z } from "zod";


export type ResTypeForTs = {schemas:{[k:string]:ZodType}, references:{[k:string]:ZodType}};
export type ResType = {[k:string]:ZodType};

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

export const ZodSimpleAttributeSchema: z.ZodType<ZodSimpleAttribute> = ZodRootSchema.extend({
// export const ZodSimpleAttributeSchema: z.ZodType<ZodSimpleAttribute> = z.lazy(
//   ()=>ZodRootSchema.extend({
    type: z.literal('simpleType'),
    // definition: withGetType(z.lazy(() => z.enum([
    //   'any',
    //   'boolean',
    //   'string',
    //   'number',
    // ])),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleTypeSchema"))), // TODO:keep Schemas clean!!!
    definition: z.enum([
      'any',
      'boolean',
      'string',
      'number',
    ])
  })
// )

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
  // args:withGetType(z.lazy(() => z.array(ZodSimpleAttributeSchema)),(ts) => ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleAttributeSchema")))), // TODO:keep Schemas clean!!!
  // returns:withGetType(z.lazy(() => ZodSimpleAttributeSchema.optional()),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleAttributeSchema"))), // TODO:keep Schemas clean!!!
})

// export type ZodFunction = z.infer<typeof ZodFunctionSchema>;

// ##############################################################################################################
export const ZodLazySchema = z.object({
  type: z.literal("lazy"),
  definition: ZodFunctionSchema,
  // definition: withGetType(z.lazy(() => ZodFunctionSchema),(ts) => ts.factory.createIdentifier("ZodFunctionSchema")), // TODO:keep Schemas clean!!!
})

export type ZodLazy = z.infer<typeof ZodLazySchema>;

// ##############################################################################################################
// export const ZodReferentialCoreElementSchema = ZodRootSchema.extend({
export const ZodReferentialCoreElementSchema = z.object({ // inheritance from ZodRootSchema leads to a different JsonSchema thus invalidates tests, although it is semantically equivalent
  optional: z.boolean().optional(),
  type: z.literal("referentialElement"),
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
  // | ZodSimpleBootstrapElement
  | ZodSimpleAttribute
  | ZodSimpleArray
  | ZodSimpleObject
  | ZodSimpleRecord
  | ZodSimpleUnion
;

export const ZodSimpleElementSchema: z.ZodType<ZodSimpleElement> = z.union([
  // withGetType(z.lazy(() => ZodEnumSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodEnumSchema"))),
  // withGetType(z.lazy(() => ZodFunctionSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodFunctionSchema"))),
  // withGetType(z.lazy(() => ZodLazySchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodLazySchema"))),
  // withGetType(z.lazy(() => ZodLiteralSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodLiteralSchema"))),
  // withGetType(z.lazy(() => ZodSimpleAttributeSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleAttributeSchema"))),
  // withGetType(z.lazy(() => ZodSimpleBootstrapElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleBootstrapElementSchema"))),
  // withGetType(z.lazy(() => ZodSimpleArraySchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleArraySchema"))),
  // withGetType(z.lazy(() => ZodSimpleObjectSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleObjectSchema"))),
  // withGetType(z.lazy(() => ZodSimpleRecordSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleRecordSchema"))),
  // withGetType(z.lazy(() => ZodSimpleUnionSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleUnionSchema"))),
  z.lazy(()=>ZodEnumSchema),
  // z.lazy(()=>ZodFunctionSchema),
  // z.lazy(()=>ZodLazySchema),
  z.lazy(()=>ZodLiteralSchema),
  z.lazy(()=>ZodSimpleAttributeSchema),
  // z.lazy(()=>ZodSimpleBootstrapElementSchema),
  // z.lazy(()=>ZodSimpleArraySchema),
  // z.lazy(()=>ZodSimpleObjectSchema),
  // z.lazy(()=>ZodSimpleRecordSchema),
  // z.lazy(()=>ZodSimpleUnionSchema),
])

// ##############################################################################################################
export type ZodReferentialElement =
| ZodSimpleElement
| ZodObjectWithReferential
| ZodReferentialCoreElement
| ZodReferentialElementArray
| ZodReferentialUnion
;

export const ZodReferentialElementSchema: z.ZodType<ZodReferentialElement> = z.union([
  // withGetType(z.lazy(() => ZodSimpleElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema"))),
  // withGetType(z.lazy(() => ZodObjectWithReferentialSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodObjectWithReferentialSchema"))),
  // withGetType(z.lazy(() => ZodReferentialCoreElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodReferentialCoreElementSchema"))),
  // withGetType(z.lazy(() => ZodReferentialElementArraySchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodReferentialElementArraySchema"))),
  // withGetType(z.lazy(() => ZodReferentialUnionSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodReferentialUnionSchema"))),
  z.lazy(()=>ZodSimpleElementSchema),
  // z.lazy(()=>ZodObjectWithReferentialSchema),
  z.lazy(()=>ZodReferentialCoreElementSchema),
  // z.lazy(()=>ZodReferentialElementArraySchema),
  // z.lazy(()=>ZodReferentialUnionSchema),
])

// ##############################################################################################################
export const ZodReferentialElementSetSchema = z.record(z.string(),ZodReferentialElementSchema);
export type ZodReferentialElementSet = z.infer<typeof ZodReferentialElementSetSchema>;


// ##############################################################################################################
export interface ZodSimpleUnion {
  type: "simpleUnion",
  definition: ZodSimpleElement[],
}
export const ZodSimpleUnionSchema: z.ZodType<ZodSimpleUnion> = z.object({
  type: z.literal("simpleUnion"),
  // definition: z.array(ZodSimpleObjectSchema)
  definition: z.lazy(()=>z.array(ZodSimpleObjectSchema))
  // definition: withGetType(
  //   z.lazy(
  //     () => z.array(ZodSimpleElementSchema)),
  //     (ts:TsType) => ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema"))))
});

  // ##############################################################################################################
export interface ZodReferentialUnion {
  type: "referentialUnion",
  definition: ZodReferentialElement[],
}
export const ZodReferentialUnionSchema: z.ZodType<ZodReferentialUnion> = z.object({
  type: z.literal("referentialUnion"),
  definition: z.lazy(()=>z.array(ZodSimpleObjectSchema))
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
// export const ZodSimpleBootstrapElementSchema = z.object({
//   type: z.literal("simpleBootstrapElement"),
// })

// export type ZodSimpleBootstrapElement = z.infer<typeof ZodSimpleBootstrapElementSchema>;

// ##############################################################################################################
export interface ZodSimpleRecord {
  type: 'record',
  // definition: ZodSimpleElement[],
  definition: ZodSimpleElement,
}

export const ZodSimpleRecordSchema: z.ZodType<ZodSimpleRecord> = z.object({
  type: z.literal('record'),
  definition: z.lazy(()=>ZodSimpleElementSchema)
  // definition: withGetType(z.lazy(() => ZodSimpleElementSchema),(ts:TsType) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema")))
})

// ##############################################################################################################
export interface ZodSimpleObject extends ZodRoot {
  type: 'object',
  definition: {[attributeName:string]:ZodSimpleElement},
  extend?: ZodSimpleObject,
}

export interface ZodObjectWithReferential extends ZodRoot {
  type: 'object',
  definition: {[attributeName:string]: ZodReferentialElement}
  // extend?: ZodSimpleObject | ZodReferentialCoreElement,
}

export const ZodSimpleObjectSchema: z.ZodType<ZodSimpleObject> = ZodRootSchema.extend({
  // optional: z.boolean().optional(),
  type: z.literal('object'),
  // extend: z.string().optional(),
  // extend: ZodSimpleObjectSchema.optional(),
  // definition: z.record(z.string(),withGetType(z.lazy(() => ZodSimpleElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema"))))
  definition: z.lazy(()=>z.record(z.string(),ZodSimpleElementSchema))
})

export const ZodObjectWithReferentialSchema: z.ZodType<ZodObjectWithReferential> = ZodRootSchema.extend({
  // optional: z.boolean().optional(),
  type: z.literal('object'),
  // extend: z.string().optional(),
  // extend: ZodReferentialCoreElementSchema.optional(),
  // extend: z.union([ZodSimpleObjectSchema,ZodReferentialCoreElementSchema]).optional(), // TODO: enable 'extend' clause! (get rid of zod-to-ts?)
  // definition: withGetType(z.lazy(() => ZodReferentialElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodReferentialElementSchema"))),
  definition: z.lazy(()=>z.record(z.string(),ZodReferentialElementSchema)),
})

// ##############################################################################################################
export interface ZodSimpleArray extends ZodRoot {
  type: 'simpleArray',
  definition: ZodSimpleElement
}
export const ZodSimpleArraySchema: z.ZodType<ZodSimpleArray> = ZodRootSchema.extend({
  // optional: z.boolean().optional(),
  type: z.literal('simpleArray'),
  definition: z.lazy(()=>ZodSimpleElementSchema)
  // definition: withGetType(z.lazy(() => ZodSimpleElementSchema),(ts) => ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ZodSimpleElementSchema"))), // TODO:keep Schemas clean!!!
});

export interface ZodReferentialElementArray extends ZodRoot {
  type: 'simpleArray',
  definition: ZodReferentialElement
}
export const ZodReferentialElementArraySchema: z.ZodType<ZodReferentialElementArray> = ZodRootSchema.extend({
  // optional: z.boolean().optional(),
  type: z.literal('simpleArray'),
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
      "definition": { type: "simpleArray", definition: { type: "simpleType", definition: "string" } },
    },
  },
  ZodLiteralSchema: {
    type: "object",
    definition: {
      "type": { type: "literal", definition: "literal" },
      "definition": { type: "simpleType", definition: "string" },
    },
  },
  // // ZodFunctionSchema: {
  // //   type: "object",
  // //   definition: {
  // //     type: { type: "literal", definition: "function" },
  // //     args: {
  // //       type: "simpleArray",
  // //       definition: { type: "referentialElement", definition: "ZodSimpleAttributeSchema" },
  // //     },
  // //     returns: { type: "referentialElement", definition: "ZodSimpleAttributeSchema", optional: true },
  // //   },
  // // },
  // // ZodLazySchema: {
  // //   type: "object",
  // //   definition: {
  // //     type: { type: "literal", definition: "lazy" },
  // //     definition: { type: "referentialElement", definition: "ZodFunctionSchema" },
  // //   },
  // // },
  ZodReferentialCoreElementSchema: {
    type: "object",
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "referentialElement" },
      "definition": { type: "simpleType", definition: "string" },
    },
  },
  ZodReferentialElementSchema: {
    type: "referentialUnion",
    definition: [
      { type: "referentialElement", definition: "ZodSimpleElementSchema" },
      { type: "referentialElement", definition: "ZodReferentialCoreElementSchema" },
    ]
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
  // // ZodSimpleArraySchema: {
  // //   type: "object",
  // //   // extend: {type:"referentialElement", definition:"ZodRootSchema"},
  // //   definition: {
  // //     "optional": { type: "simpleType", definition: "boolean", optional: true },
  // //     "type": { type: "literal", definition: "simpleArray" },
  // //     "definition": { type: "referentialElement", definition: "ZodSimpleElementSchema" },
  // //   },
  // // },
  // // ZodSimpleObjectSchema: {
  // //   type: "object",
  // //   definition: {
  // //     "optional": { type: "simpleType", definition: "boolean", optional: true },
  // //     "type": { type: "literal", definition: "object" },
  // //     "definition": {
  // //       type: "record",
  // //       definition: { type: "simpleBootstrapElement" },
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
  // ZodSimpleBootstrapElementSchema: { type: "simpleBootstrapElement" },
  ZodSimpleElementSchema: {
    type: "referentialUnion",
    definition: [
      { type: "referentialElement", definition: "ZodEnumSchema"},
      // { type: "referentialElement", definition: "ZodFunctionSchema"},
      // { type: "referentialElement", definition: "ZodLazySchema"},
      { type: "referentialElement", definition: "ZodLiteralSchema"},
      { type: "referentialElement", definition: "ZodSimpleAttributeSchema"},
      // { type: "referentialElement", definition: "ZodSimpleBootstrapElementSchema"},
      // { type: "referentialElement", definition: "ZodSimpleArraySchema"},
      // { type: "referentialElement", definition: "ZodSimpleObjectSchema"},
      // { type: "referentialElement", definition: "ZodSimpleRecordSchema"},
      // { type: "referentialElement", definition: "ZodSimpleUnionSchema"},
      // { type: "referentialElement", definition: "ZodRootSchema"},
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
