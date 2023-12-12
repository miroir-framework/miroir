import { z } from "zod";

import {
  ZodSchemaAndDescription, jzodElementSchemaToZodSchemaAndDescription,
} from "@miroir-framework/jzod";
import {
  JzodElement,
  jzodObject
} from "@miroir-framework/jzod-ts";
import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance.js";

import miroirJzodSchemaBootstrap from '../../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json';
import { applicationSection } from "./preprocessor-generated/miroirFundamentalType.js";


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
  applicationSection: applicationSection.optional(),
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

export const miroirJzodSchemaBootstrapZodSchema:ZodSchemaAndDescription = jzodElementSchemaToZodSchemaAndDescription(miroirJzodSchemaBootstrap.definition as JzodElement);

export default {}