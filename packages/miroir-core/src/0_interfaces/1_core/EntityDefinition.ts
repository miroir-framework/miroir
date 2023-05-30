import { z } from "zod";
import { EntityInstanceWithNameSchema } from "./Instance.js";

// export const EntityAttributeTypeObject:{[id in string]:id} = {
// export const EntityAttributeTypeObject = {
//   'STRING': 'STRING', 
//   'ARRAY': 'ARRAY', 
//   'OBJECT': 'OBJECT',
//   'ENTITY_INSTANCE_UUID': 'ENTITY_INSTANCE_UUID',
// }
// export type EntityAttributeType = keyof typeof EntityAttributeTypeObject;
// export const EntityAttributeTypeNameArray: EntityAttributeType[] = Object.keys(EntityAttributeTypeObject) as EntityAttributeType[];

// ##########################################################################################
export const EntityAttributeTypeSchema = z.union([
  z.literal("STRING"),
  z.literal("ARRAY"),
  z.literal("OBJECT"),
  z.literal("ENTITY_INSTANCE_UUID")
]);
export type EntityAttributeType = z.infer<typeof EntityAttributeTypeSchema>;



// ##########################################################################################
export const UuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof UuidSchema>;


// export type Uuid = string;

// ##########################################################################################
export const EntityAttributeSchema = z.object({
  id: z.number(),
  name: z.string(),
  defaultLabel: z.string(),
  type: EntityAttributeTypeSchema,
  description: z.string().optional(),
  nullable: z.boolean(),
  editable: z.boolean(),
});
export type EntityAttribute = z.infer<typeof EntityAttributeSchema>;


// #################################################################################################
export const MetaEntitySchema = EntityInstanceWithNameSchema.extend({
  description: z.string(),
  application: UuidSchema,
});
export type MetaEntity = z.infer<typeof MetaEntitySchema>;


// #################################################################################################
export const EntityDefinitionSchema = EntityInstanceWithNameSchema.extend({
  entityUuid: UuidSchema,
  description: z.string().optional(),
  instanceValidationJsonSchema:z.object({}).optional(),
  attributes: z.array(EntityAttributeSchema)
});
export type EntityDefinition = z.infer<typeof EntityDefinitionSchema>;
// export interface EntityDefinition extends EntityInstanceWithName {
//   "entityUuid": Uuid,
//   "description"?:string,
//   "instanceValidationJsonSchema": {},
//   "attributes": EntityAttribute[],
// };


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

export default {}