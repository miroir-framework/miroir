import type { EntityDefinition, EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ##############################################################################################
/**
 * Returns the attribute name used as the primary key for instances of the given entity.
 * Defaults to "uuid" when the EntityDefinition does not specify an idAttribute.
 */
export function getEntityPrimaryKeyAttribute(entityDefinition: EntityDefinition): string {
  return (entityDefinition as any).idAttribute ?? "uuid";
}

// ##############################################################################################
/**
 * Returns the primary key value for a given entity instance, based on its EntityDefinition.
 */
export function getInstancePrimaryKeyValue(entityDefinition: EntityDefinition, instance: EntityInstance): string {
  const pkAttr = getEntityPrimaryKeyAttribute(entityDefinition);
  return String((instance as any)[pkAttr]);
}

// ##############################################################################################
/**
 * Returns true if the entity uses the default uuid-based primary key.
 */
export function entityHasUuidPrimaryKey(entityDefinition: EntityDefinition): boolean {
  return getEntityPrimaryKeyAttribute(entityDefinition) === "uuid";
}
