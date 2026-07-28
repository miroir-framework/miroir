/**
 * #220 — EntityVersion / redundant live EntityVersion compatibility shims.
 *
 * Quarantine for dual-write / UUID-reuse helpers from #217. Do **not** use for
 * Application Version freeze or historical EntityVersion minting (#216):
 * `presentEntityAsRedundantEntityDefinition` reuses the live Entity uuid.
 *
 * EOL: remove when no deployment ships incomplete Entities / legacy ED create payloads.
 */

import type {
  Entity,
  EntityVersion,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { alignEntityDefinitionToPresentEntity } from "./entityPresentModel.js";

/**
 * @deprecated Prefer Entity present-model fields. UUID-reuse — unsafe for freeze.
 * Keep only for non-UI dual-write / legacy enrichment (#220 compat).
 */
export function presentEntityAsRedundantEntityDefinition(
  entity: Entity,
  entityDefinitions: EntityVersion[] = [],
): EntityVersion {
  const existing = entityDefinitions.find(
    (entityVersion) => entityVersion.entityUuid === entity.uuid,
  );
  if (existing) {
    return alignEntityDefinitionToPresentEntity(entity, existing);
  }
  if (!entity.mlSchema) {
    throw new Error(
      `presentEntityAsRedundantEntityDefinition: Entity ${entity.uuid} (${entity.name}) has no mlSchema`,
    );
  }
  return {
    uuid: entity.uuid,
    parentName: "EntityVersion",
    parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
    name: entity.name,
    entityUuid: entity.uuid,
    conceptLevel: "Model",
    mlSchema: entity.mlSchema,
    ...(entity.viewAttributes !== undefined
      ? { viewAttributes: entity.viewAttributes }
      : {}),
    ...(entity.defaultInstanceDetailsReportUuid !== undefined
      ? { defaultInstanceDetailsReportUuid: entity.defaultInstanceDetailsReportUuid }
      : {}),
    ...(entity.idAttribute !== undefined ? { idAttribute: entity.idAttribute } : {}),
    ...(entity.display !== undefined ? { display: entity.display } : {}),
    ...(entity.cache !== undefined ? { cache: entity.cache } : {}),
    ...(entity.icon !== undefined ? { icon: entity.icon } : {}),
  } as EntityVersion;
}


/** Re-export dual-write persistence for a single compat import surface (#220). */
export {
  detectEntityEntityDefinitionInconsistencies,
  persistEntityThenEntityDefinition,
} from "./modelEntityDualWritePersistence.js";
export type {
  DualWriteFailurePolicy,
  DualWriteInconsistency,
  DualWriteInconsistencyReport,
  PersistEntityThenEntityDefinitionOps,
} from "./modelEntityDualWritePersistence.js";
