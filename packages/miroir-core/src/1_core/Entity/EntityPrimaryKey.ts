import type { EntityInstance } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error, Domain2ElementFailed } from "../../0_interfaces/2_domain/DomainElement";
import {
  isHttpExternalEntity,
  isSqlExternalEntity,
  type EntityExternalDataSourceCarrier,
} from "./entityExternalDataSource";

// Composite key separator. Individual values are escaped so this separator is unambiguous.
const COMPOSITE_KEY_SEPARATOR = "|";
const COMPOSITE_KEY_ESCAPE = "\\";

/**
 * Any present-model source that may declare `idAttribute` (Entity after #217 Phase 1,
 * or legacy EntityVersion).
 */
export type EntityPrimaryKeySource = {
  idAttribute?: (string | string[] | boolean) | undefined;
};

// Prefix of the positional keys given to the instances of an Entity without primary key (#175).
export const POSITIONAL_KEY_PREFIX = "#";

// ##############################################################################################
/**
 * Returns true if the entity declares `idAttribute: false`: its instances have no primary key
 * and can repeat (#175). Only External SQL and HTTP entities may be declared so.
 */
export function entityHasNoPrimaryKey(source: EntityPrimaryKeySource | undefined): boolean {
  return source?.idAttribute === false;
}

// ##############################################################################################
/**
 * Model-validation check of an Entity's `idAttribute` beyond its schema: `true` has no meaning,
 * and `false` (no primary key) is only allowed on External SQL and HTTP entities, whose rows
 * Miroir only reads. Returns the error messages, empty when the declaration is valid.
 */
export function checkEntityPrimaryKeyDeclaration(
  entity: EntityPrimaryKeySource & EntityExternalDataSourceCarrier & { name?: string },
): string[] {
  if (entity.idAttribute === true) {
    return [`Entity ${entity.name}: idAttribute true is not allowed, use false for an entity without primary key`];
  }
  if (entity.idAttribute === false && !isSqlExternalEntity(entity) && !isHttpExternalEntity(entity)) {
    return [
      `Entity ${entity.name}: idAttribute false (no primary key) is only allowed on External SQL and HTTP entities`,
    ];
  }
  return [];
}

// ##############################################################################################
/**
 * Error returned when a key-based operation (create, update, delete instance) targets an entity
 * without primary key: its instances can not be addressed individually, they are read-only (#175).
 */
export function keylessEntityInstanceActionError(actionType: string, entityLabel: string): Action2Error {
  return new Action2Error(
    "InvalidAction",
    `${actionType} refused: entity ${entityLabel} has no primary key (idAttribute: false), its instances are read-only`,
    [actionType],
    undefined,
    { entity: entityLabel },
  );
}

// ##############################################################################################
/**
 * Query failure returned when a key-based extractor or combiner (extractorByPrimaryKey,
 * combinerOneToOne) targets an entity without primary key (#175).
 */
export function keylessEntityQueryFailure(extractorType: string, entityUuid: string): Domain2ElementFailed {
  return new Domain2ElementFailed({
    queryFailure: "QueryNotExecutable",
    query: extractorType,
    entityUuid,
    failureMessage: `${extractorType} is not possible on entity ${entityUuid}: it has no primary key (idAttribute: false)`,
  });
}

// ##############################################################################################
/**
 * Returns the attribute name(s) used as the primary key for instances of the given entity.
 * Defaults to "uuid" when the source does not specify an idAttribute.
 * For backward compatibility, returns a single string for single-attribute PKs.
 * Throws for an entity without primary key (`idAttribute: false`): callers handling such
 * entities must check `entityHasNoPrimaryKey` first, or use `getInstanceCacheKeys`.
 */
export function getEntityPrimaryKeyAttribute(source: EntityPrimaryKeySource): string | string[] {
  if (typeof source.idAttribute === "boolean") {
    throw new Error(
      `getEntityPrimaryKeyAttribute: entity ${(source as any).name ?? (source as any).uuid ?? ""} has no primary key (idAttribute: ${source.idAttribute})`
    );
  }
  return source.idAttribute ?? "uuid";
}

// ##############################################################################################
/**
 * Returns the attribute names as an array, always. Wraps single-attribute PKs in an array.
 */
export function getEntityPrimaryKeyAttributes(source: EntityPrimaryKeySource): string[] {
  const idAttribute = getEntityPrimaryKeyAttribute(source);
  return Array.isArray(idAttribute) ? idAttribute : [idAttribute];
}

// ##############################################################################################
/**
 * Returns true if the entity has a composite (multi-attribute) primary key.
 */
export function entityHasCompositePrimaryKey(source: EntityPrimaryKeySource): boolean {
  return Array.isArray(source.idAttribute);
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
 * Returns the primary key value for a given entity instance, based on its EntityVersion.
 * For composite PKs, returns the serialized composite key string.
 */
export function getInstancePrimaryKeyValue(source: EntityPrimaryKeySource, instance: EntityInstance): string {
  const pkAttributes = getEntityPrimaryKeyAttributes(source);
  return serializeCompositeKeyValue(pkAttributes, instance);
}

// ##############################################################################################
/**
 * Returns the keys under which a batch of instances is indexed in memory (local cache, query results).
 * Keyed entities: the serialized primary key of each instance.
 * Entities without primary key (`idAttribute: false`): positional keys `#0`…`#n-1`, so that identical
 * rows are all kept. Positional keys are only meaningful within the batch; they are never stored on rows.
 */
export function getInstanceCacheKeys(source: EntityPrimaryKeySource, instances: EntityInstance[]): string[] {
  if (entityHasNoPrimaryKey(source)) {
    return instances.map((_, index) => POSITIONAL_KEY_PREFIX + index);
  }
  const pkAttributes = getEntityPrimaryKeyAttributes(source);
  return instances.map((instance) => serializeCompositeKeyValue(pkAttributes, instance));
}

// ##############################################################################################
/**
 * Indexes a batch of instances by the keys given by `getInstanceCacheKeys`.
 */
export function indexInstancesByCacheKey(
  source: EntityPrimaryKeySource,
  instances: EntityInstance[]
): Record<string, EntityInstance> {
  const keys = getInstanceCacheKeys(source, instances);
  return Object.fromEntries(instances.map((instance, index) => [keys[index], instance]));
}

// ##############################################################################################
/**
 * Returns true if the entity uses the default uuid-based primary key.
 */
export function entityHasUuidPrimaryKey(source: EntityPrimaryKeySource): boolean {
  if (entityHasNoPrimaryKey(source)) {
    return false;
  }
  const idAttr = getEntityPrimaryKeyAttribute(source);
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
