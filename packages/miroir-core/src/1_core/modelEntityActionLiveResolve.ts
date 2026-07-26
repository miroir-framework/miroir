/**
 * Issue #217 Phase 11 — Entity-authoritative model Action resolution.
 * Resolve live Entity / optional redundant EntityDefinition without requiring
 * Action payloads to carry entityDefinitionUuid.
 */

import type {
  Entity,
  EntityDefinition,
  MetaModel,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  entityHasCompletePresentModel,
  presentEntityAsRedundantEntityDefinition,
  resolvePresentEntityFromModel,
} from "./entityPresentModel.js";
import {
  applyAlterEntityAttributePair,
  applyMlSchemaColumnChanges,
  applyRenameEntityPair,
  type AlterEntityAttributeColumns,
  type EntityEntityDefinitionPair,
} from "./modelEntityDualWrite.js";

export function resolveLiveEntityDefinitionForAction(
  currentModel: MetaModel,
  entityUuid: string,
  entityDefinitionUuid?: string | undefined,
): EntityDefinition | undefined {
  if (entityDefinitionUuid) {
    const byUuid = currentModel.entityDefinitions?.find((ed) => ed.uuid === entityDefinitionUuid);
    if (byUuid) {
      return byUuid;
    }
  }
  const matches =
    currentModel.entityDefinitions?.filter((ed) => ed.entityUuid === entityUuid) ?? [];
  if (matches.length === 1) {
    return matches[0];
  }
  return undefined;
}

export type LiveEntityMutationPlan =
  | { mode: "dualWrite"; pair: EntityEntityDefinitionPair }
  | { mode: "entityOnly"; entity: Entity };

/**
 * Rename: dual-write when a live redundant ED exists; otherwise Entity-only when complete.
 */
export function planRenameEntityMutation(
  currentModel: MetaModel,
  entityUuid: string,
  targetName: string,
  entityDefinitionUuid?: string | undefined,
): LiveEntityMutationPlan | undefined {
  const entity = resolvePresentEntityFromModel(currentModel, entityUuid);
  if (!entity) {
    return undefined;
  }
  const entityDefinition = resolveLiveEntityDefinitionForAction(
    currentModel,
    entityUuid,
    entityDefinitionUuid,
  );
  if (entityDefinition) {
    return {
      mode: "dualWrite",
      pair: applyRenameEntityPair(entity, entityDefinition, targetName),
    };
  }
  if (!entityHasCompletePresentModel(entity)) {
    return undefined;
  }
  return {
    mode: "entityOnly",
    entity: { ...entity, name: targetName },
  };
}

/**
 * Alter attributes: dual-write when live ED exists; otherwise Entity-only when complete.
 */
export function planAlterEntityAttributeMutation(
  currentModel: MetaModel,
  entityUuid: string,
  changes: AlterEntityAttributeColumns,
  entityDefinitionUuid?: string | undefined,
): LiveEntityMutationPlan | undefined {
  const entity = resolvePresentEntityFromModel(currentModel, entityUuid);
  if (!entity) {
    return undefined;
  }
  const entityDefinition = resolveLiveEntityDefinitionForAction(
    currentModel,
    entityUuid,
    entityDefinitionUuid,
  );
  if (entityDefinition) {
    return {
      mode: "dualWrite",
      pair: applyAlterEntityAttributePair(entity, entityDefinition, changes),
    };
  }
  if (!entity.mlSchema) {
    return undefined;
  }
  return {
    mode: "entityOnly",
    entity: {
      ...entity,
      mlSchema: applyMlSchemaColumnChanges(entity.mlSchema, changes),
    },
  };
}

/**
 * For bootstrap / reset paths that still call createEntity(entity, entityDefinition):
 * prefer live ED; otherwise synthesize a redundant ED-shaped copy from Entity.
 */
export function resolveOrSynthesizeEntityDefinitionForCreate(
  entity: Entity,
  entityDefinitions: EntityDefinition[] = [],
): EntityDefinition {
  const existing = entityDefinitions.find((ed) => ed.entityUuid === entity.uuid);
  if (existing) {
    return existing;
  }
  return presentEntityAsRedundantEntityDefinition(entity, entityDefinitions);
}
