import { z } from "zod";
import { EntityInstanceWithNameSchema } from "./Instance.js";

// ##########################################################################################
export const EntityAttributeNoArrayTypeSchema = z.union([
  z.literal("STRING"),
  z.literal("BOOLEAN"),
  // z.literal("ARRAY"),
  z.literal("OBJECT"),
  z.literal("ENTITY_INSTANCE_UUID")
]);
export type EntityAttributeNoArrayType = z.infer<typeof EntityAttributeNoArrayTypeSchema>;

export const EntityAttributeTypeSchema = z.union([
  EntityAttributeNoArrayTypeSchema,
  z.literal("ARRAY"),
]);
export type EntityAttributeType = z.infer<typeof EntityAttributeTypeSchema>;



// ##########################################################################################
export const UuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof UuidSchema>;

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
  type: EntityAttributeNoArrayTypeSchema,
});
export type EntityAttributeCore = z.infer<typeof EntityAttributeCoreSchema>;

export const EntityArrayAttributeSchema = EntityAttributeUntypedCoreSchema.extend({
  type: z.literal("ARRAY"),
  lineFormat: z.array(EntityAttributeCoreSchema)
});
export type EntityArrayAttribute = z.infer<typeof EntityArrayAttributeSchema>;

export const EntityAttributeSchema = z.union([
  EntityAttributeCoreSchema,
  EntityArrayAttributeSchema
]);
export type EntityAttribute = z.infer<typeof EntityAttributeSchema>;

export const EntityAttributePartialSchema = z.union([
  EntityAttributeCoreSchema.partial(),
  EntityArrayAttributeSchema.partial()
]);
export type EntityAttributePartial = z.infer<typeof EntityAttributePartialSchema>;


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
  // attributes: z.array(EntityAttributeCoreSchema)
  attributes: z.array(EntityAttributeSchema)
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

export default {}