/**
 * Issue #217 Phase 11 — Entity-authoritative model Action resolution.
 * Resolve live Entity / optional redundant EntityVersion without requiring
 * Action payloads to carry entityVersionUuid.
 *
 * When Entity has a complete present model, mutations are Entity-only (live ED
 * copies become historical / not updated). Create is always Entity-only (#220).
 * Dual-write remains for alter/rename when Entity is incomplete and a live ED
 * is available for enrichment.
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
  applyAlterEntityAttributePair,
  applyMlSchemaColumnChanges,
  applyRenameEntityPair,
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
  const entityVersion = resolveLiveEntityDefinitionForAction(
    currentModel,
    entityUuid,
    entityVersionUuid,
  );
  if (entityVersion) {
    return {
      mode: "dualWrite",
      pair: applyRenameEntityPair(entity, entityVersion, targetName),
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
  const entityVersion = resolveLiveEntityDefinitionForAction(
    currentModel,
    entityUuid,
    entityVersionUuid,
  );
  if (entityVersion) {
    return {
      mode: "dualWrite",
      pair: applyAlterEntityAttributePair(entity, entityVersion, changes),
    };
  }
  return undefined;
}

/** @deprecated Use import from entityDefinitionCompatibility (#220). */
export { resolveOrSynthesizeEntityDefinitionForCreate } from "./entityDefinitionCompatibility.js";
