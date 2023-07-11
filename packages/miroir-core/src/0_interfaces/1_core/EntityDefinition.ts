import { ZodTypeAny, z } from "zod";
// import { transform as _transform, isObject as _isObject, isUndefined as _isUndefined } from "lodash";
import _ from "lodash";
const { transform:_transform, isObject: _isObject, isUndefined: _isUndefined } = _;

import { ApplicationSectionSchema, EntityInstanceWithNameSchema } from "./Instance.js";
import { JzodObject, JzodToZodResult, jzodBootstrapSetSchema, jzodObjectSchema, jzodSchemaSetToZodSchemaSet } from "@miroir-framework/jzod";
import { entityDefinitionEntityDefinitionAttributeNewSchema } from "./writtenByHandSchema.js";


// ##########################################################################################

export const EntityAttributeExpandedTypeSchema = z.union([
  z.literal("UUID"),
  z.literal("STRING"),
  z.literal("BOOLEAN"),
  z.literal("OBJECT"),
]);
export type EntityAttributeExpandedType = z.infer<typeof EntityAttributeExpandedTypeSchema>;


export const EntityAttributeTypeSchema = z.union([
  EntityAttributeExpandedTypeSchema,
  z.literal("ENTITY_INSTANCE_UUID"),
  z.literal("ARRAY")
]);
export type EntityAttributeType = z.infer<typeof EntityAttributeTypeSchema>;



export const UuidSchema = z.string().uuid();
// const px = z.custom<`${number}px`>((val) => {
//   return /^\d+px$/.test(val as string);
// });
// type px = z.infer<typeof px>; // `${number}px`

export type Uuid = z.infer<typeof UuidSchema>;
// export type Uuid = UUID<string>;

// ##########################################################################################
export const EntityAttributeUntypedCoreSchema = z.object({
  id: z.number(),
  name: z.string(),
  defaultLabel: z.string(),
  description: z.string().optional(),
  nullable: z.boolean(),
  editable: z.boolean(),
});
export type EntityAttributeUntypedCore = z.infer<typeof EntityAttributeUntypedCoreSchema>;

export const EntityAttributeCoreSchema = EntityAttributeUntypedCoreSchema.extend({
  type: EntityAttributeExpandedTypeSchema,
});
export type EntityAttributeCore = z.infer<typeof EntityAttributeCoreSchema>;

export const EntityArrayAttributeSchema = EntityAttributeUntypedCoreSchema.extend({
  type: z.literal("ARRAY"),
  lineFormat: z.array(EntityAttributeCoreSchema)
});
export type EntityArrayAttribute = z.infer<typeof EntityArrayAttributeSchema>;

export const EntityForeignKeyAttributeSchema = EntityAttributeUntypedCoreSchema.extend({
  type: z.literal("ENTITY_INSTANCE_UUID"),
  applicationSection: ApplicationSectionSchema.optional(),
  entityUuid: z.string().uuid()
});
export type EntityForeignKeyAttribute = z.infer<typeof EntityForeignKeyAttributeSchema>;

export const EntityAttributeSchema = z.union([
  EntityAttributeCoreSchema,
  EntityForeignKeyAttributeSchema,
  EntityArrayAttributeSchema,
]);
export type EntityAttribute = z.infer<typeof EntityAttributeSchema>;

export const EntityAttributePartialSchema = z.union([
  EntityAttributeCoreSchema.partial(),
  EntityForeignKeyAttributeSchema.partial(),
  EntityArrayAttributeSchema.partial()
]);
export type EntityAttributePartial = z.infer<typeof EntityAttributePartialSchema>;


// #################################################################################################
export const MetaEntitySchema = EntityInstanceWithNameSchema.extend({
  description: z.string(),
  application: UuidSchema,
});
export type MetaEntity = z.infer<typeof MetaEntitySchema>;


// // ##########################################################################################
// export const entityDefinitionEntityDefinitionAttributes2Schema = entityDefinitionEntityDefinitionZodSchema.shape.attributesNew.unwrap().element;
// export type entityDefinitionEntityDefinitionAttributes2Type = z.infer<typeof entityDefinitionEntityDefinitionAttributes2Schema>

// #################################################################################################
export const EntityDefinitionSchema = EntityInstanceWithNameSchema.extend({
  entityUuid: UuidSchema,
  description: z.string().optional(),
  jzodSchema: jzodObjectSchema.optional(),
  // jzodSchema: z.any().optional(),
  attributes: z.array(EntityAttributeSchema),
  attributesNew: z.array(entityDefinitionEntityDefinitionAttributeNewSchema).optional()
});
export type EntityDefinition = z.infer<typeof EntityDefinitionSchema>;

/**
* duplicated from Redux
* @public
*/
export interface InstanceDictionaryNum<T> {
  [id: number]: T | undefined;
}

/**
* duplicated from Redux
* @public
*/
export interface InstanceDictionary<T> extends InstanceDictionaryNum<T> {
  [id: string]: T | undefined;
}

// #################################################################################################
const miroirJzodExtraPropertiesSchema: JzodObject = {
  "type": "object",
  "definition": {
    "id": {"type":"simpleType", "definition": "number"},
    "defaultLabel": {"type":"simpleType", "definition": "string"},
    "editable": {"type":"simpleType", "definition": "boolean"},
  }
}

// const { transform, isObject, isUndefined } = _

const deepTransform = (obj:any, iterator:(key:any,value:any)=>[any,any]) => _transform(obj, (acc:any, val, key) => {
  const [k, v] = iterator(key, val) // use the iterator and get a pair of key and value
  
  if(_isUndefined(k)) return // skip if no updated key
  
  // set the updated key and value, and if the value is an object iterate it as well
  acc[k] = _isObject(v) ? deepTransform(v, iterator) : v 
})

// const obj = {"this":{"is_not":{"something":"we want to keep"},"is":{"a":{"good_idea":22},"b":{"bad_idea":67},"c":[{"meh_idea":22}]}}}

const miroirJzodExtraPropertiesSchemaTransform = (key:any, value:any):[any,any] => {
  if (String(key) == 'extra') return [key, miroirJzodExtraPropertiesSchema]
  
  return [key, value]
}


export const miroirJzodSchemaBootstrap = deepTransform(jzodBootstrapSetSchema,miroirJzodExtraPropertiesSchemaTransform)

console.log("miroirJzodBootstrapSchema",miroirJzodSchemaBootstrap);

export const miroirJzodSchemaBootstrapZodSchema:JzodToZodResult<ZodTypeAny> = jzodSchemaSetToZodSchemaSet(miroirJzodSchemaBootstrap);

export default {}