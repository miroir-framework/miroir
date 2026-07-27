/**
 * #216 — Application Version freeze (Entities only, linear history, Option A diff).
 * #220 — Freeze-adjacent vocabulary uses EntityVersion only.
 */

import { v4 as uuidv4 } from "uuid";

import type {
  Entity,
  EntityVersion,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

// ---------------------------------------------------------------------------
// Phase 0: Action type constant
// ---------------------------------------------------------------------------

/** Model Endpoint actionType for user-triggered freeze (ADR D1-a). */
export const FREEZE_APPLICATION_VERSION_ACTION_TYPE = "freezeApplicationVersion" as const;

export type FreezeApplicationVersionActionType =
  typeof FREEZE_APPLICATION_VERSION_ACTION_TYPE;

// ---------------------------------------------------------------------------
// Phase 1: Versioning gate
// ---------------------------------------------------------------------------

/**
 * Reject freeze / version-history Actions for unversioned applications.
 * Throws when `versioningEnabled` is not strictly `true`.
 */
export function assertApplicationVersioningEnabled(
  selfApplication: { versioningEnabled?: boolean | undefined },
): void {
  if (selfApplication.versioningEnabled !== true) {
    throw new Error(
      `Application does not have versioning enabled (versioningEnabled: ${String(selfApplication.versioningEnabled)})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Entity snapshot → historical EntityVersions
// ---------------------------------------------------------------------------

/** EntityVersion entity UUID (bootstrap metamodel identity). */
const ENTITY_VERSION_ENTITY_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";

export interface SnapshotOptions {
  /** UUID generator override for testing determinism. */
  newUuid?: () => string;
}

/**
 * Deep-copy present-model Entity fields into new immutable EntityVersion instances.
 * Each output has a **new** UUID; `entityUuid` references the live Entity.
 *
 * Throws if any Entity lacks `mlSchema` (incomplete present model).
 *
 * Do **not** use UUID-reuse compat helpers (e.g. presentEntityAsRedundant…) for freeze —
 * those reuse the live Entity uuid and are unsafe for historical minting (#220 / #216).
 */
export function snapshotEntitiesAsHistoricalEntityVersions(
  entities: Entity[],
  options?: SnapshotOptions,
): EntityVersion[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return entities.map((entity) => {
    if (!entity.mlSchema) {
      throw new Error(
        `Cannot snapshot Entity ${entity.uuid} (${entity.name}): mlSchema is missing`,
      );
    }

    const snapshot: EntityVersion = {
      uuid: mintUuid(),
      parentUuid: ENTITY_VERSION_ENTITY_UUID,
      parentName: "EntityVersion",
      name: entity.name,
      entityUuid: entity.uuid,
      conceptLevel: entity.conceptLevel ?? "Model",
      mlSchema: structuredClone(entity.mlSchema),
      ...(entity.defaultInstanceDetailsReportUuid !== undefined
        ? { defaultInstanceDetailsReportUuid: entity.defaultInstanceDetailsReportUuid }
        : {}),
      ...(entity.viewAttributes !== undefined
        ? { viewAttributes: structuredClone(entity.viewAttributes) }
        : {}),
      ...(entity.icon !== undefined ? { icon: structuredClone(entity.icon) } : {}),
      ...(entity.display !== undefined ? { display: structuredClone(entity.display) } : {}),
      ...(entity.cache !== undefined ? { cache: structuredClone(entity.cache) } : {}),
      ...(entity.idAttribute !== undefined
        ? { idAttribute: structuredClone(entity.idAttribute) }
        : {}),
      ...(entity.externalDataSource !== undefined
        ? { externalDataSource: structuredClone(entity.externalDataSource) }
        : {}),
    };

    return snapshot;
  });
}
