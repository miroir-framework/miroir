/**
 * Issue #217 Phase 11 — Entity-authoritative model Action resolution.
 * Resolve live Entity without requiring Action payloads to carry entityVersionUuid.
 *
 * Create / drop / rename / alter are always Entity-only (#220).
 *
 * #220 — UUID-reuse synthesize helpers live in entityDefinitionCompatibility.
 */

import type {
  Entity,
  EntityVersion,
  MetaModel,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  entityHasCompletePresentModel,
  resolvePresentEntityFromModel,
} from "./entityPresentModel.js";
import {
  applyMlSchemaColumnChanges,
  type AlterEntityAttributeColumns,
  type EntityEntityDefinitionPair,
} from "./modelEntityDualWrite.js";

export function resolveLiveEntityDefinitionForAction(
  currentModel: MetaModel,
  entityUuid: string,
  entityVersionUuid?: string | undefined,
): EntityVersion | undefined {
  if (entityVersionUuid) {
    const byUuid = currentModel.entityVersions?.find((ed) => ed.uuid === entityVersionUuid);
    if (byUuid) {
      return byUuid;
    }
  }
  const matches =
    currentModel.entityVersions?.filter((ed) => ed.entityUuid === entityUuid) ?? [];
  if (matches.length === 1) {
    return matches[0];
  }
  return undefined;
}

export type LiveEntityMutationPlan =
  | { mode: "dualWrite"; pair: EntityEntityDefinitionPair }
  | { mode: "entityOnly"; entity: Entity };

/**
 * Create: Entity-only when Entity has complete present model (`mlSchema`).
 * #220 — no EntityVersion dual-write on create; incomplete Entity is rejected.
 */
export function planCreateEntityMutation(
  entity: Entity,
): LiveEntityMutationPlan | undefined {
  if (!entityHasCompletePresentModel(entity)) {
    return undefined;
  }
  return { mode: "entityOnly", entity };
}

/**
 * #220 — rename is always Entity-only (never dual-write EntityVersion).
 */
export function planRenameEntityMutation(
  currentModel: MetaModel,
  entityUuid: string,
  targetName: string,
): LiveEntityMutationPlan | undefined {
  const entity = resolvePresentEntityFromModel(currentModel, entityUuid);
  if (!entity) {
    return undefined;
  }
  return {
    mode: "entityOnly",
    entity: { ...entity, name: targetName },
  };
}

/**
 * #220 — alter attributes is always Entity-only (never dual-write EntityVersion).
 * Requires complete Entity.mlSchema.
 */
export function planAlterEntityAttributeMutation(
  currentModel: MetaModel,
  entityUuid: string,
  changes: AlterEntityAttributeColumns,
): LiveEntityMutationPlan | undefined {
  const entity = resolvePresentEntityFromModel(currentModel, entityUuid);
  if (!entity?.mlSchema || !entityHasCompletePresentModel(entity)) {
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

/** @deprecated Use import from entityDefinitionCompatibility (#220). */
export { resolveOrSynthesizeEntityDefinitionForCreate } from "./entityDefinitionCompatibility.js";
