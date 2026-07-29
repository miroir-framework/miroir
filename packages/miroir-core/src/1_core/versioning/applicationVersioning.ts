/**
 * Issue #217 Phase 0 — present-model characterization helpers.
 *
 * Pure inventory / projection / consistency utilities for the Entity ↔
 * EntityVersion migration. No runtime resolution or dual-write yet.
 */

/**
 * Definition-bearing fields that live on EntityVersion today and must
 * eventually be carried by the authoritative live Entity (#217 §1.1).
 */
export const ENTITY_PRESENT_MODEL_DEFINITION_FIELDS = [
  "defaultInstanceDetailsReportUuid",
  "viewAttributes",
  "icon",
  "display",
  "cache",
  "idAttribute",
  "externalDataSource",
  "mlSchema",
] as const;

export type EntityPresentModelDefinitionField =
  (typeof ENTITY_PRESENT_MODEL_DEFINITION_FIELDS)[number];


/** Creation-time versioning capability fixtures (#217 §3.4). */
export const VERSIONED_APPLICATION_FIXTURE = {
  versioningEnabled: true as const,
};

export const UNVERSIONED_APPLICATION_FIXTURE = {
  versioningEnabled: false as const,
};

/**
 * Policy contract (#217 §11.1): `versioningEnabled` is immutable after creation.
 * Call sites that update SelfApplication must invoke this before persisting.
 * Runtime Action wiring is later phases; this encodes the invariant now.
 */
export function assertVersioningEnabledImmutable(
  before: { versioningEnabled?: boolean | undefined },
  after: { versioningEnabled?: boolean | undefined },
): void {
  if (before.versioningEnabled !== after.versioningEnabled) {
    throw new Error(
      `SelfApplication.versioningEnabled is immutable (was ${String(before.versioningEnabled)}, attempted ${String(after.versioningEnabled)})`,
    );
  }
}

