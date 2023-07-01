import ts from 'typescript';
import { ZodType, ZodTypeAny, z } from "zod";


export type ResTypeForTs = {schemas:{[k:string]:ZodType}, references:{[k:string]:ZodType}};
export interface ZodSchemaAndDescription {zodSchema:ZodTypeAny, description:string};

export type ResType = {[k:string]:ZodSchemaAndDescription};

type TsType = typeof ts;

export const ZodRootSchema = z.object({
  optional: z.boolean().optional(),
});
export type ZodRoot = z.infer<typeof ZodRootSchema>;

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
export interface ZodRecord {
  type: 'record',
  // definition: ZodSimpleElement[],
  definition: ZodReferentialElement,
}

export const ZodRecordSchema: z.ZodType<ZodRecord> = z.object({
  type: z.literal('record'),
  definition: z.lazy(()=>ZodReferentialElementSchema)
})

// ##############################################################################################################
export type ZodReferentialElement =
| ZodReferentialElementArray
| ZodEnum
| ZodFunction
| ZodLazy
| ZodLiteral
| ZodSimpleAttribute
| ZodRecord
| ZodObjectWithReferential
| ZodReferentialCoreElement
| ZodReferentialElementArray
| ZodUnion
;

export const ZodReferentialElementSchema: z.ZodType<ZodReferentialElement> = z.union([
  z.lazy(()=>ZodReferentialElementArraySchema),
  z.lazy(()=>ZodEnumSchema),
  z.lazy(()=>ZodFunctionSchema),
  z.lazy(()=>ZodLazySchema),
  z.lazy(()=>ZodLiteralSchema),
  z.lazy(()=>ZodObjectWithReferentialSchema),
  z.lazy(()=>ZodRecordSchema),
  z.lazy(()=>ZodReferentialCoreElementSchema),
  z.lazy(()=>ZodSimpleAttributeSchema),
  z.lazy(()=>ZodUnionSchema),
])

// ##############################################################################################################
export const ZodReferentialElementSetSchema = z.record(z.string(),ZodReferentialElementSchema);
export type ZodReferentialElementSet = z.infer<typeof ZodReferentialElementSetSchema>;


  // ##############################################################################################################
export interface ZodUnion {
  type: "union",
  definition: ZodReferentialElement[],
}
export const ZodUnionSchema: z.ZodType<ZodUnion> = z.object({
  type: z.literal("union"),
  definition: z.lazy(()=>z.array(ZodReferentialElementSchema))
});

// ##############################################################################################################
export const ZodSimpleBootstrapElementSchema = z.object({
  type: z.literal("simpleBootstrapElement"),
})

export type ZodSimpleBootstrapElement = z.infer<typeof ZodSimpleBootstrapElementSchema>;

// ##############################################################################################################
export interface ZodObjectWithReferential extends ZodRoot {
  type: 'object',
  definition: {[attributeName:string]: ZodReferentialElement}
  // extend?: ZodSimpleObject | ZodReferentialCoreElement,
}

export const ZodObjectWithReferentialSchema: z.ZodType<ZodObjectWithReferential> = z.object({
  optional: z.boolean().optional(),
  type: z.literal('object'),
  definition: z.lazy(()=>z.record(z.string(),ZodReferentialElementSchema)),
})

// ##############################################################################################################
export interface ZodReferentialElementArray extends ZodRoot {
  type: 'array',
  definition: ZodReferentialElement
}
export const ZodReferentialElementArraySchema: z.ZodType<ZodReferentialElementArray> = z.object({ // issue with JsonSchema conversion when using extend from ZodRootSchema, although the 2 are functionnaly equivalent
  optional: z.boolean().optional(),
  type: z.literal('array'),
  definition: z.lazy(()=>ZodReferentialElementSchema)
})

// ##############################################################################################################

export const zodJsonBootstrapSchema: ZodReferentialElementSet = {
  ZodArraySchema: { // before ZodSimpleElementSchema
    type: "object",
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "array" },
      "definition": { type: "schemaReference", definition: "ZodReferentialElementSchema" },
    },
  },
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
  ZodObjectSchema: {
    type: "object",
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "object" },
      "definition": {
        type: "record",
        definition: { type: "schemaReference", definition:"ZodReferentialElementSchema" },
      },
    },
  },
  ZodRecordSchema: {
    type: "object",
    definition: {
      type: { type: "literal", definition: "record" },
      definition: { type: "schemaReference", definition: "ZodReferentialElementSchema" },
    },
  },
  ZodReferentialCoreElementSchema: {
    type: "object",
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "schemaReference" },
      "definition": { type: "simpleType", definition: "string" },
    },
  },
  ZodReferentialElementSchema: {
    type: "union",
    definition: [
      { type: "schemaReference", definition: "ZodArraySchema"},
      { type: "schemaReference", definition: "ZodEnumSchema"},
      { type: "schemaReference", definition: "ZodFunctionSchema"},
      { type: "schemaReference", definition: "ZodLazySchema"},
      { type: "schemaReference", definition: "ZodLiteralSchema"},
      { type: "schemaReference", definition: "ZodObjectSchema"},
      { type: "schemaReference", definition: "ZodRecordSchema"},
      { type: "schemaReference", definition: "ZodReferentialCoreElementSchema"},
      { type: "schemaReference", definition: "ZodSimpleAttributeSchema"},
      { type: "schemaReference", definition: "ZodUnionSchema"},
    ]
  },
  ZodReferentialElementSetSchema: {
    type: "record",
    definition: { type: "schemaReference", definition:"ZodReferentialElementSchema" },
  },
  ZodSimpleAttributeSchema: {
    type: "object",
    // extend: {type:"referentialElement", definition:"ZodRootSchema"},
    definition: {
      "optional": { type: "simpleType", definition: "boolean", optional: true },
      "type": { type: "literal", definition: "simpleType" },
      "definition": { type: "enum", definition: ['any','boolean','string','number',] },
    },
  },
  ZodUnionSchema: {
    type: "object",
    definition: {
      "type": { type: "literal", definition: "union" },
      "definition": {
        type: "array",
        definition: { type: "schemaReference", definition: "ZodReferentialElementSchema" },
      },
    },
  },
};
