/**
 * Attribute projection for entity instances (#214 Phase 1).
 * Absent / empty attributes ⇒ identity (full object).
 * Identity fields (PK + structural) are always retained when projecting.
 */

import type { EntityVersion } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getEntityPrimaryKeyAttributes } from "./EntityPrimaryKey.js";

/** Always kept alongside the entity primary key when projecting. */
export const INSTANCE_PROJECTION_STRUCTURAL_FIELDS = [
  "parentUuid",
  "parentName",
] as const;

/**
 * @deprecated Prefer {@link resolveProjectionIdentityFields}; kept for call sites
 * that assume UUID PKs.
 */
export const INSTANCE_PROJECTION_IDENTITY_FIELDS = [
  "uuid",
  ...INSTANCE_PROJECTION_STRUCTURAL_FIELDS,
] as const;

export type InstanceProjectionAttributes = readonly string[];

/**
 * Identity keys to retain under projection.
 * Uses `idAttribute` when provided (Entity present model); otherwise defaults to `uuid`
 * (see AGENTS.md Primary Key Support).
 */
export function resolveProjectionIdentityFields(
  entityOrVersion?: { idAttribute?: string | string[] } | null
): string[] {
  const pkAttributes = entityOrVersion
    ? getEntityPrimaryKeyAttributes(entityOrVersion as EntityVersion)
    : ["uuid"];
  return [...new Set<string>([...pkAttributes, ...INSTANCE_PROJECTION_STRUCTURAL_FIELDS])];
}

/**
 * Builds a set of attributes to keep.
 * @param attributes - The attributes to project.
 * @param identityFields - The identity fields to project.
 * @returns The set of attributes to project.
 */
function buildProjectedSet(
  attributes: InstanceProjectionAttributes,
  identityFields: readonly string[]
): Set<string> {
  return new Set<string>([...identityFields, ...attributes]);
}

/** 
 * "projects" a single entity instance by selecting a subset of attributes.
 * @param instance - The entity instance to project.
 * @param attributes - The attributes to project.
 * @param identityFields - The identity fields to project.
 * @returns The projected entity instance.
 */
export function projectEntityInstance<T extends Record<string, unknown>>(
  instance: T,
  attributes: InstanceProjectionAttributes | undefined | null,
  identityFields?: readonly string[] | null
): T {
  if (!attributes || attributes.length === 0) {
    return instance;
  }
  const identity = identityFields ?? resolveProjectionIdentityFields(null);
  const keep = buildProjectedSet(attributes, identity);
  const projected: Record<string, unknown> = {};
  for (const key of Object.keys(instance)) {
    if (keep.has(key)) {
      projected[key] = instance[key];
    }
  }
  return projected as T;
}

/**
 * "projects" a collection of entity instances by applying the same "projection" to each.
 * "projection" is the process of selecting a subset of attributes from an entity instance.
 * @param instances - The collection of entity instances to project.
 * @param attributes - The attributes to project.
 * @param identityFields - The identity fields to project.
 * @returns The projected collection of entity instances.
 */
export function projectEntityInstancesOnAttributes<T extends Record<string, unknown>>(
  instances: T[],
  attributes: InstanceProjectionAttributes | undefined | null,
  identityFields?: readonly string[] | null
): T[] {
  if (!attributes || attributes.length === 0) {
    return instances;
  }
  const identity = identityFields ?? resolveProjectionIdentityFields(null);
  return instances.map((instance) =>
    projectEntityInstance(instance, attributes, identity)
  );
}

/** 
 * Parses a comma-separated string or array of attributes into an array of attributes.
 * The input comes from the `attributes` query parameter of the REST API.
 * @param raw - The comma-separated string or array of attributes to parse.
 * @returns The array of attributes, or undefined if the input is undefined or null.
 */
export function parseAttributesProjectionParam(
  raw: any // eslint-disable-line @typescript-eslint/no-explicit-any
): string[] | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (Array.isArray(raw)) {
    const list = raw
      .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
      .map((s) => s.trim())
      .filter(Boolean);
    return list.length > 0 ? list : undefined;
  }
  if (typeof raw === "string") {
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return list.length > 0 ? list : undefined;
  }
  return undefined;
}
