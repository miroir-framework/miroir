/**
 * Issue #217 Phase 11 — Entity-authoritative model Action resolution.
 * Resolve live Entity / optional redundant EntityDefinition without requiring
 * Action payloads to carry entityVersionUuid.
 *
 * When Entity has a complete present model, mutations are Entity-only (live ED
 * copies become historical / not updated). Dual-write remains for create when
 * an EntityDefinition is explicitly supplied, and for alter/rename when Entity
 * is incomplete and a live ED is available for enrichment.
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
  normalizeCreateEntityPair,
  type AlterEntityAttributeColumns,
  type EntityEntityDefinitionPair,
} from "./modelEntityDualWrite.js";

export function resolveLiveEntityDefinitionForAction(
  currentModel: MetaModel,
  entityUuid: string,
  entityVersionUuid?: string | undefined,
): EntityDefinition | undefined {
  if (entityVersionUuid) {
    const byUuid = currentModel.entityDefinitions?.find((ed) => ed.uuid === entityVersionUuid);
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
 * Create: Entity-only when complete and no ED supplied; dual-write when ED given
 * (bootstrap / legacy payloads) or when Entity is incomplete and ED can enrich.
 */
export function planCreateEntityMutation(
  entity: Entity,
  entityDefinition?: EntityDefinition | undefined,
): LiveEntityMutationPlan | undefined {
  if (entityDefinition) {
    return {
      mode: "dualWrite",
      pair: normalizeCreateEntityPair(entity, entityDefinition),
    };
  }
  if (!entityHasCompletePresentModel(entity)) {
    return undefined;
  }
  return { mode: "entityOnly", entity };
}

/**
 * Rename: Entity-only when present model is complete; dual-write only to enrich
 * incomplete Entity from a live redundant ED.
 */
export function planRenameEntityMutation(
  currentModel: MetaModel,
  entityUuid: string,
  targetName: string,
  entityVersionUuid?: string | undefined,
): LiveEntityMutationPlan | undefined {
  const entity = resolvePresentEntityFromModel(currentModel, entityUuid);
  if (!entity) {
    return undefined;
  }
  if (entityHasCompletePresentModel(entity)) {
    return {
      mode: "entityOnly",
      entity: { ...entity, name: targetName },
    };
  }
  const entityDefinition = resolveLiveEntityDefinitionForAction(
    currentModel,
    entityUuid,
    entityVersionUuid,
  );
  if (entityDefinition) {
    return {
      mode: "dualWrite",
      pair: applyRenameEntityPair(entity, entityDefinition, targetName),
    };
  }
  return undefined;
}

/**
 * Alter attributes: Entity-only when present model is complete; dual-write only
 * when Entity is incomplete and a live ED can enrich.
 */
export function planAlterEntityAttributeMutation(
  currentModel: MetaModel,
  entityUuid: string,
  changes: AlterEntityAttributeColumns,
  entityVersionUuid?: string | undefined,
): LiveEntityMutationPlan | undefined {
  const entity = resolvePresentEntityFromModel(currentModel, entityUuid);
  if (!entity) {
    return undefined;
  }
  if (entityHasCompletePresentModel(entity) && entity.mlSchema) {
    return {
      mode: "entityOnly",
      entity: {
        ...entity,
        mlSchema: applyMlSchemaColumnChanges(entity.mlSchema, changes),
      },
    };
  }
  const entityDefinition = resolveLiveEntityDefinitionForAction(
    currentModel,
    entityUuid,
    entityVersionUuid,
  );
  if (entityDefinition) {
    return {
      mode: "dualWrite",
      pair: applyAlterEntityAttributePair(entity, entityDefinition, changes),
    };
  }
  return undefined;
}

/**
 * For bootstrap / reset paths that still call createEntity(entity, entityDefinition):
 * prefer live ED; otherwise synthesize a redundant ED-shaped copy from Entity.
 * Prefer Entity-only create via optional ED on createEntity when Entity is complete.
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
