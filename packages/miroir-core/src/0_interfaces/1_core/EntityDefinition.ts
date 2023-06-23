import { z } from "zod";
import { ApplicationSectionSchema, EntityInstanceWithNameSchema } from "./Instance.js";

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
  z.literal("ARRAY"),
]);
export type EntityAttributeType = z.infer<typeof EntityAttributeTypeSchema>;



// ##########################################################################################
// type VersionChar =
//     | '1' | '2' | '3' | '4' | '5';

// type Char =
//     | '0' | '1' | '2' | '3'
//     | '4' | '5' | '6' | '7'
//     | '8' | '9' | 'a' | 'b'
//     | 'c' | 'd' | 'e' | 'f';

// type Prev<X extends number> =
//     [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, ...never[]][X];

// type HasLength<S extends string, Len extends number> = [Len] extends [0]
//     ? (S extends '' ? true : never)
//     : (S extends `${infer C}${infer Rest}`
//         ? (Lowercase<C> extends Char ? HasLength<Rest, Prev<Len>> : never)
//         : never);

// type Char4<S extends string> = true extends HasLength<S, 4> ? S : never;
// type Char8<S extends string> = true extends HasLength<S, 8> ? S : never;
// type Char12<S extends string> = true extends HasLength<S, 12> ? S : never;

// type VersionGroup<S extends string> = S extends `${infer Version}${infer Rest}`
//     ? (Version extends VersionChar
//         ? (true extends HasLength<Rest, 3> ? S : never)
//         : never)
//     : never;

// type NilUUID = '00000000-0000-0000-0000-000000000000';

// type UUID<S extends string> = S extends NilUUID
//     ? S
//     : (S extends `${infer S8}-${infer S4_1}-${infer S4_2}-${infer S4_3}-${infer S12}`
//         ? (S8 extends Char8<S8>
//             ? (S4_1 extends Char4<S4_1>
//                 ? (S4_2 extends VersionGroup<S4_2>
//                     ? (S4_3 extends Char4<S4_3>
//                         ? (S12 extends Char12<S12>
//                             ? S
//                             : never)
//                         : never)
//                     : never)
//                 : never)
//             : never)
//         : never);



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


// #################################################################################################
export const EntityDefinitionSchema = EntityInstanceWithNameSchema.extend({
  entityUuid: UuidSchema,
  description: z.string().optional(),
  instanceValidationJsonSchema:z.object({}).optional(),
  attributes: z.array(EntityAttributeSchema)
  // attributes: z.array(z.any())
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