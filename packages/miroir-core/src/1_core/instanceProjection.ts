/**
 * Attribute projection for entity instances (#214 Phase 1).
 * Absent / empty attributes ⇒ identity (full object).
 * Identity fields (PK + structural) are always retained when projecting.
 */

import type { EntityDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
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
 * Uses EntityDefinition.idAttribute when provided; otherwise defaults to `uuid`
 * (see AGENTS.md Primary Key Support).
 */
export function resolveProjectionIdentityFields(
  entityDefinition?: { idAttribute?: string | string[] } | null
): string[] {
  const pkAttributes = entityDefinition
    ? getEntityPrimaryKeyAttributes(entityDefinition as EntityDefinition)
    : ["uuid"];
  return [...new Set<string>([...pkAttributes, ...INSTANCE_PROJECTION_STRUCTURAL_FIELDS])];
}

function buildKeepSet(
  attributes: InstanceProjectionAttributes,
  identityFields: readonly string[]
): Set<string> {
  return new Set<string>([...identityFields, ...attributes]);
}

/** Returns a shallow copy with only allow-listed + identity keys. */
export function projectEntityInstance<T extends Record<string, unknown>>(
  instance: T,
  attributes: InstanceProjectionAttributes | undefined | null,
  identityFields?: readonly string[] | null
): T {
  if (!attributes || attributes.length === 0) {
    return instance;
  }
  const identity = identityFields ?? resolveProjectionIdentityFields(null);
  const keep = buildKeepSet(attributes, identity);
  const projected: Record<string, unknown> = {};
  for (const key of Object.keys(instance)) {
    if (keep.has(key)) {
      projected[key] = instance[key];
    }
  }
  return projected as T;
}

export function projectEntityInstances<T extends Record<string, unknown>>(
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

/** Normalize query/body attributes param into a string array. */
export function parseAttributesProjectionParam(
  raw: unknown
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
