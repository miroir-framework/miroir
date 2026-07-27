/**
 * Issue #217 Phase 6 — persistence dual-write: always Entity then EntityVersion.
 * Non-transactional backends compensate or best-effort + consistency detector.
 * No single serialized artifact.
 *
 * #220 EOL: remove when no deployment ships incomplete Entities / legacy ED
 * create payloads. Not for Application Version freeze snapshot minting (#216).
 * Call-site allowlist: tests/1_core/220-entityVersion-tech-debt/220.phase4.unit.test.ts
 */

import { Action2Error } from "../0_interfaces/2_domain/DomainElement.js";
import type { Action2VoidReturnType } from "../0_interfaces/2_domain/DomainElement.js";
import type {
  Entity,
  EntityVersion,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ACTION_OK } from "./constants.js";
import {
  compareEntityPresentModelDefinitions,
  inventoryEntityEntityDefinitionJoins,
} from "./entityPresentModel.js";
import type { EntityEntityDefinitionPair } from "./modelEntityDualWrite.js";

export type DualWriteInconsistency = {
  entityUuid: string;
  entityName?: string | undefined;
  differingFields: string[];
};

export type DualWriteInconsistencyReport = {
  inconsistencies: DualWriteInconsistency[];
};

/**
 * Write Entity first, then EntityVersion.
 * - `compensate`: on ED failure, restore previous Entity (update) or delete Entity (create).
 * - `bestEffortDetect`: leave Entity written; report inconsistency for a detector.
 */
export type DualWriteFailurePolicy =
  | { kind: "compensate" }
  | {
      kind: "bestEffortDetect";
      reportInconsistency: (report: DualWriteInconsistencyReport) => void;
    };

export type PersistEntityThenEntityDefinitionOps = {
  writeEntity: (entity: Entity) => Promise<Action2VoidReturnType>;
  writeEntityDefinition: (
    entityVersion: EntityVersion,
  ) => Promise<Action2VoidReturnType>;
  /** Create-path compensation when Entity was written but EntityVersion failed. */
  deleteEntity?: (entity: Entity) => Promise<Action2VoidReturnType>;
  /** Update-path compensation: restore Entity to pre-write snapshot. */
  restoreEntity?: (entity: Entity) => Promise<Action2VoidReturnType>;
};

function isActionFailure(result: Action2VoidReturnType): result is Action2Error {
  return result instanceof Action2Error;
}

/**
 * Persist a dual-write pair: Entity upsert, then EntityVersion upsert.
 */
export async function persistEntityThenEntityDefinition(
  pair: EntityEntityDefinitionPair,
  ops: PersistEntityThenEntityDefinitionOps,
  options: {
    failurePolicy: DualWriteFailurePolicy;
    /** When set, this is an update; compensate via restoreEntity(previousEntity). */
    previousEntity?: Entity | undefined;
  },
): Promise<Action2VoidReturnType> {
  const entityResult = await ops.writeEntity(pair.entity);
  if (isActionFailure(entityResult)) {
    return entityResult;
  }

  const entityDefinitionResult = await ops.writeEntityDefinition(pair.entityVersion);
  if (!isActionFailure(entityDefinitionResult)) {
    return ACTION_OK;
  }

  if (options.failurePolicy.kind === "bestEffortDetect") {
    const comparison = compareEntityPresentModelDefinitions(
      pair.entity,
      // Detector sees intended pair divergence vs what may still be on disk —
      // report that ED write failed after Entity write.
      pair.entityVersion,
    );
    options.failurePolicy.reportInconsistency({
      inconsistencies: [
        {
          entityUuid: pair.entity.uuid,
          entityName: pair.entity.name,
          differingFields: comparison.equal
            ? ["entityDefinitionWriteFailed"]
            : comparison.differingFields,
        },
      ],
    });
    return entityDefinitionResult;
  }

  // compensate
  if (options.previousEntity !== undefined && ops.restoreEntity) {
    const restoreResult = await ops.restoreEntity(options.previousEntity);
    if (isActionFailure(restoreResult)) {
      return new Action2Error(
        "FailedToHandleAction",
        `EntityVersion write failed and Entity restore also failed for ${pair.entity.uuid}: ${entityDefinitionResult.errorMessage}; restore: ${restoreResult.errorMessage}`,
        ["persistEntityThenEntityDefinition", "compensate", "restoreEntity"],
        entityDefinitionResult as any,
      );
    }
  } else if (ops.deleteEntity) {
    const deleteResult = await ops.deleteEntity(pair.entity);
    if (isActionFailure(deleteResult)) {
      return new Action2Error(
        "FailedToHandleAction",
        `EntityVersion write failed and Entity delete (compensate) also failed for ${pair.entity.uuid}: ${entityDefinitionResult.errorMessage}; delete: ${deleteResult.errorMessage}`,
        ["persistEntityThenEntityDefinition", "compensate", "deleteEntity"],
        entityDefinitionResult as any,
      );
    }
  }

  return entityDefinitionResult;
}

/**
 * §11.3 / Phase 6 consistency detector: find Entity ↔ EntityVersion present-model divergences.
 */
export function detectEntityEntityDefinitionInconsistencies(
  entities: Entity[],
  entityDefinitions: EntityVersion[],
): DualWriteInconsistency[] {
  const inventory = inventoryEntityEntityDefinitionJoins(entities, entityDefinitions);
  const entityByUuid = new Map(entities.map((entity) => [entity.uuid, entity]));
  const entityDefinitionByUuid = new Map(
    entityDefinitions.map((entityVersion) => [entityVersion.uuid, entityVersion]),
  );
  const inconsistencies: DualWriteInconsistency[] = [];

  for (const match of inventory.matched) {
    const entity = entityByUuid.get(match.entityUuid);
    const entityVersion = entityDefinitionByUuid.get(match.entityDefinitionUuids[0]!);
    if (!entity || !entityVersion) {
      continue;
    }
    const comparison = compareEntityPresentModelDefinitions(entity, entityVersion);
    if (!comparison.equal) {
      inconsistencies.push({
        entityUuid: entity.uuid,
        entityName: entity.name,
        differingFields: comparison.differingFields,
      });
    }
  }

  for (const entity of inventory.orphanEntities) {
    inconsistencies.push({
      entityUuid: entity.uuid,
      entityName: entity.name,
      differingFields: ["missingEntityDefinition"],
    });
  }

  for (const entityVersion of inventory.orphanEntityDefinitions) {
    inconsistencies.push({
      entityUuid: entityVersion.entityUuid,
      entityName: entityVersion.name,
      differingFields: ["orphanEntityDefinition"],
    });
  }

  for (const multi of inventory.multipleDefinitions) {
    const entity = entityByUuid.get(multi.entityUuid);
    inconsistencies.push({
      entityUuid: multi.entityUuid,
      entityName: entity?.name,
      differingFields: ["multipleEntityDefinitions"],
    });
  }

  return inconsistencies;
}
