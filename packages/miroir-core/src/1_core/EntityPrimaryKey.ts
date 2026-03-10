import type { EntityDefinition, EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement";

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

// ##############################################################################################
/**
 * Resolves the parentUuid for an entity instance using the following strategy:
 * 1. If the instance has a parentUuid attribute, use it.
 * 2. Otherwise, fall back to the payloadParentUuid (from the action payload).
 * 3. If neither is available, return an Action2Error.
 */
export function resolveInstanceParentUuid(
  instance: EntityInstance,
  payloadParentUuid?: string
): string | Action2Error {
  if (instance.parentUuid) {
    return instance.parentUuid;
  }
  if (payloadParentUuid) {
    return payloadParentUuid;
  }
  return new Action2Error(
    "FailedToResolveParentUuid",
    `Could not resolve parentUuid for instance ${JSON.stringify(instance)}: neither instance.parentUuid nor action payload.parentUuid is defined.`
  );
}
