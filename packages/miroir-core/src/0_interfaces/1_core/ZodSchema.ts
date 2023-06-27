import { ZodAny, ZodTypeAny, string, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { printNode, zodToTs } from 'zod-to-ts'
import { ResType } from "../../1_core/ZodSchema";

export const ZodRootSchema = z.object({
  optional: z.boolean().optional(),
});
export type ZodRoot = z.infer<typeof ZodRootSchema>;

export const ZodSimpleTypeSchema = z.enum([
  'boolean',
  'string',
  'number',
]);
export type ZodSimpleType = z.infer<typeof ZodSimpleTypeSchema>;

export const ZodSchemaTypeSchema = z.enum([
  'enum',
  'simpleObject',
  'simpleArray',
]);
export type ZodSchemaType = z.infer<typeof ZodSchemaTypeSchema>;


// ##############################################################################################################
export interface ZodSimpleAttribute extends ZodRoot {
  type: "simpleType",
  definition: ZodSimpleType
}

const ZodSimpleAttributeSchema: z.ZodType<ZodSimpleAttribute> = z.lazy(
  ()=>z.object({
    optional: z.boolean().optional(),
    type: z.literal('simpleType'),
    definition: ZodSimpleTypeSchema
  })
)

// ##############################################################################################################
export const ZodReferentialCoreElementSchema = ZodRootSchema.extend({
  type: z.literal("referentialElement"),
  definition: z.string()
})

export type ZodReferentialCoreElement = z.infer<typeof ZodReferentialCoreElementSchema>;

// ##############################################################################################################
export type ZodSimpleElement = ZodSimpleAttribute | ZodSimpleArray | ZodSimpleObject;

const ZodSimpleElementSchema: z.ZodType<ZodSimpleElement> = z.lazy(
  ()=>z.union([
    ZodSimpleAttributeSchema,
    ZodSimpleArraySchema,
    ZodSimpleObjectSchema
  ])
)

// ##############################################################################################################
export type ZodReferentialElement =
  | ZodReferentialCoreElement
  | ZodSimpleElement
  | ZodSimpleAttribute
  | ZodSimpleArray
  | ZodReferentialElementArray
  | ZodSimpleObjectWithReferential
;

export const ZodReferentialElementSchema: z.ZodType<ZodReferentialElement> = z.lazy(
  ()=>z.union([
    ZodSimpleAttributeSchema,
    ZodSimpleArraySchema,
    ZodSimpleElementSchema,
    ZodSimpleObjectWithReferentialSchema,
    ZodReferentialCoreElementSchema,
    ZodReferentialElementArraySchema,
  ])
)

export const ZodReferentialElementSetSchema = z.record(z.string(),ZodReferentialElementSchema);
export type ZodReferentialElementSet = z.infer<typeof ZodReferentialElementSetSchema>;


// ##############################################################################################################
export interface ZodSimpleObjectCore extends ZodRoot {
  type: 'simpleObject',
  extend?: string,
}

export interface ZodSimpleObject extends ZodSimpleObjectCore {
  definition: {[attributeName:string]:ZodSimpleElement}
}

export interface ZodSimpleObjectWithReferential extends ZodSimpleObjectCore {
  // definition: {[attributeName:string]: ZodSimpleElement | ZodReferentialElement}
  definition: {[attributeName:string]: ZodReferentialElement}
}

const ZodSimpleObjectSchema: z.ZodType<ZodSimpleObject> = z.lazy(
  ()=>z.object({
    optional: z.boolean().optional(),
    type: z.literal('simpleObject'),
    extend: z.string().optional(),
    definition: z.record(z.string(),ZodSimpleElementSchema)
  })
)

const ZodSimpleObjectWithReferentialSchema: z.ZodType<ZodSimpleObjectWithReferential> = z.lazy(
  ()=>z.object({
    optional: z.boolean().optional(),
    type: z.literal('simpleObject'),
    extend: z.string().optional(),
    // definition: z.record(z.string(),z.union([ZodSimpleElementSchema,ZodReferentialElementSchema]))
    definition: z.record(z.string(),ZodReferentialElementSchema)
  })
)

// ##############################################################################################################
// export interface ZodReferentialCoreElement extends ZodRoot {
//   type: "referentialElement",
//   definition: string
// }
// export type ZodReferentialObject = ZodSimpleObject | ZodReferentialCoreElement;

// ##############################################################################################################
export interface ZodSimpleArray extends ZodRoot {
  type: 'simpleArray',
  definition: ZodSimpleElement
}
const ZodSimpleArraySchema: z.ZodType<ZodSimpleArray> = z.lazy(
  ()=>z.object({
    optional: z.boolean().optional(),
    type: z.literal('simpleArray'),
    definition: ZodSimpleElementSchema
  })
)

export interface ZodReferentialElementArray extends ZodRoot {
  type: 'simpleArray',
  definition: ZodReferentialElement
}
const ZodReferentialElementArraySchema: z.ZodType<ZodReferentialElementArray> = z.lazy(
  ()=>z.object({
    optional: z.boolean().optional(),
    type: z.literal('simpleArray'),
    definition: ZodReferentialElementSchema
  })
)

// ##############################################################################################################

// ##############################################################################################################

// export const Test2: ZodSimpleElement = {
//   type: "simpleObject",
//   definition: {
//     a: { type: "simpleType", definition: "string" },
//     b: {
//       type: "simpleObject",
//       definition: { 
//         b1: { type: "simpleType", definition: "boolean", optional: true },
//         b2: { type:"simpleArray", definition: {type:"simpleType",definition:"boolean"}}
//       },
//     },
//   },
// };

// export const test2Schema = z.object({
//   a: z.string(),
//   b: z.object({b1:z.boolean().optional(), b2: z.array(z.boolean())})
// })
// export function _zodToTs(z:ResType, name: string):{node:{[k:string]:any}} {
export function _zodToTs(referentialSet:ResType, name: string):{node:{[k:string]:any /*ZodToTsReturn*/}} {
  // console.log('_zodToTs referentialSet called',referentialSet);
  const result = {
    node: Object.fromEntries(
      Object.entries(referentialSet).map(
        (e:[string,any])=> {
          // console.log('_zodToTs calling zodToTs on',e[1],e[0]);
          const result:[string,any] = [e[0], zodToTs(e[1],e[0]).node];
          // console.log('_zodToTs zodToTs return',result);
          
          return result
            // e[0], zodToTs(e[1],e[0])
          
        }
      )
    )
  } as any;
  // console.log('_zodToTs zodToTs return',result);
  return result;
}

export function _zodToJsonSchema(referentialSet:ResType, name: string):{node:{[k:string]:any /*ZodToTsReturn*/}} {
  // console.log('_zodToTs referentialSet called',referentialSet);
  const result = {
    node: Object.fromEntries(
      Object.entries(referentialSet).map(
        (e:[string,any])=> {
          // console.log('_zodToTs calling zodToTs on',e[1],e[0]);
          const result:[string,any] = [e[0], zodToJsonSchema(e[1])];
          // console.log('_zodToTs zodToTs return',result);
          
          return result
            // e[0], zodToTs(e[1],e[0])
          
        }
      )
    )
  } as any;
  // console.log('_zodToTs zodToTs return',result);
  return result;
}

export function _printNode(node:{[k:string]:any /*ZodToTsReturn*/}, withName?:boolean):string {
  // console.log('_printNode called on',node);

  const entries = Object.entries(node);
  // if (entries.length == 1) {
    return (`${entries.length > 1?'{':''}${
          entries.map((e:[string,any],i)=> {
            const currentNode = '' + (withName?e[0] + ':':'') + printNode(e[1]) //+ ((i<entries.length-1)?',':'')
            // console.log('_printNode index',i,currentNode);
            
            return currentNode
          })}${entries.length > 1?'}':''}`)
  // } else {
    
  // }
}


// ######################################################################################################
