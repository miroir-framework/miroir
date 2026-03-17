import type { EntityDefinition, EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement";

// Composite key separator. Individual values are escaped so this separator is unambiguous.
const COMPOSITE_KEY_SEPARATOR = "|";
const COMPOSITE_KEY_ESCAPE = "\\";

// ##############################################################################################
/**
 * Returns the attribute name(s) used as the primary key for instances of the given entity.
 * Defaults to "uuid" when the EntityDefinition does not specify an idAttribute.
 * For backward compatibility, returns a single string for single-attribute PKs.
 */
export function getEntityPrimaryKeyAttribute(entityDefinition: EntityDefinition): string | string[] {
  return (entityDefinition as any).idAttribute ?? "uuid";
}

// ##############################################################################################
/**
 * Returns the attribute names as an array, always. Wraps single-attribute PKs in an array.
 */
export function getEntityPrimaryKeyAttributes(entityDefinition: EntityDefinition): string[] {
  const idAttribute = getEntityPrimaryKeyAttribute(entityDefinition);
  return Array.isArray(idAttribute) ? idAttribute : [idAttribute];
}

// ##############################################################################################
/**
 * Returns true if the entity has a composite (multi-attribute) primary key.
 */
export function entityHasCompositePrimaryKey(entityDefinition: EntityDefinition): boolean {
  return Array.isArray((entityDefinition as any).idAttribute);
}

// ##############################################################################################
/**
 * Escapes a single PK component value for safe serialization with the separator.
 */
function escapeKeyComponent(value: string): string {
  // Escape backslashes first, then separator
  return value
    .replace(/\\/g, COMPOSITE_KEY_ESCAPE + COMPOSITE_KEY_ESCAPE)
    .replace(/\|/g, COMPOSITE_KEY_ESCAPE + COMPOSITE_KEY_SEPARATOR);
}

// ##############################################################################################
/**
 * Unescapes a single PK component value after deserialization.
 */
function unescapeKeyComponent(value: string): string {
  let result = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] === COMPOSITE_KEY_ESCAPE && i + 1 < value.length) {
      result += value[i + 1];
      i++; // skip next char
    } else {
      result += value[i];
    }
  }
  return result;
}

// ##############################################################################################
/**
 * Serializes a composite primary key value from an instance into a single canonical string.
 * For single-attribute PKs, returns the plain string value.
 * For composite PKs, returns escaped components joined by COMPOSITE_KEY_SEPARATOR.
 */
export function serializeCompositeKeyValue(pkAttributes: string[], instance: EntityInstance): string {
  if (pkAttributes.length === 1) {
    return String((instance as any)[pkAttributes[0]]);
  }
  return pkAttributes.map(attr => escapeKeyComponent(String((instance as any)[attr]))).join(COMPOSITE_KEY_SEPARATOR);
}

// ##############################################################################################
/**
 * Parses a serialized composite key string back into individual attribute values.
 * Returns an ordered array of string values corresponding to the PK attributes.
 */
export function parseCompositeKeyValue(pkAttributes: string[], serializedKey: string): Record<string, string> {
  if (pkAttributes.length === 1) {
    return { [pkAttributes[0]]: serializedKey };
  }
  // Split respecting escaped separators
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < serializedKey.length; i++) {
    if (serializedKey[i] === COMPOSITE_KEY_ESCAPE && i + 1 < serializedKey.length) {
      current += serializedKey[i] + serializedKey[i + 1];
      i++;
    } else if (serializedKey[i] === COMPOSITE_KEY_SEPARATOR) {
      parts.push(current);
      current = "";
    } else {
      current += serializedKey[i];
    }
  }
  parts.push(current);
  const result: Record<string, string> = {};
  for (let i = 0; i < pkAttributes.length; i++) {
    result[pkAttributes[i]] = unescapeKeyComponent(parts[i] ?? "");
  }
  return result;
}

// ##############################################################################################
/**
 * Returns the primary key value for a given entity instance, based on its EntityDefinition.
 * For composite PKs, returns the serialized composite key string.
 */
export function getInstancePrimaryKeyValue(entityDefinition: EntityDefinition, instance: EntityInstance): string {
  const pkAttributes = getEntityPrimaryKeyAttributes(entityDefinition);
  return serializeCompositeKeyValue(pkAttributes, instance);
}

// ##############################################################################################
/**
 * Returns true if the entity uses the default uuid-based primary key.
 */
export function entityHasUuidPrimaryKey(entityDefinition: EntityDefinition): boolean {
  const idAttr = getEntityPrimaryKeyAttribute(entityDefinition);
  return idAttr === "uuid";
}

// ##############################################################################################
/**
 * Returns the FK value(s) from a reference object for a given FK attribute specification.
 * For single-attribute FK (string), returns the single attribute value from the reference object.
 * For composite FK (string[]), serializes the multiple FK attribute values into a composite key string.
 * This is used by combiners to resolve FK→PK joins: the returned string can be used
 * to look up the target instance in an index keyed by serialized PK values.
 */
export function getForeignKeyValue(
  fkAttribute: string | string[],
  referenceObject: Record<string, any>
): string | undefined {
  if (!Array.isArray(fkAttribute)) {
    const val = referenceObject[fkAttribute];
    return val != null ? String(val) : undefined;
  }
  // Composite FK: serialize positionally
  if (fkAttribute.some(attr => referenceObject[attr] == null)) {
    return undefined;
  }
  return fkAttribute.map(attr => escapeKeyComponent(String(referenceObject[attr]))).join(COMPOSITE_KEY_SEPARATOR);
}

// ##############################################################################################
/**
 * Tests whether an instance matches a FK→PK join condition.
 * For single-attribute FK (string), checks if instance[fkAttr] === referenceValue.
 * For composite FK (string[]), checks if each instance[fkAttr[i]] matches the
 * corresponding component of the serialized reference value.
 */
export function instanceMatchesForeignKey(
  fkAttribute: string | string[],
  instance: Record<string, any>,
  referenceValue: string
): boolean {
  if (!Array.isArray(fkAttribute)) {
    return (instance as any)[fkAttribute] === referenceValue;
  }
  // Composite FK: parse the reference value and compare each attribute
  const parts = parseCompositeKeyValue(fkAttribute, referenceValue);
  return fkAttribute.every(attr => String(instance[attr] ?? "") === parts[attr]);
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
