/**
 * Issue #217 Phase 5 — Entity-authoritative model mutations with dual-write.
 * Pure helpers: construct post-change Entity + redundant EntityDefinition pairs.
 */

import type {
  Entity,
  EntityDefinition,
  JzodElement,
  JzodObject,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  alignEntityDefinitionToPresentEntity,
  compareEntityPresentModelDefinitions,
  entityHasCompletePresentModel,
  resolveCurrentEntityModel,
} from "./entityPresentModel.js";

export type EntityEntityDefinitionPair = {
  entity: Entity;
  entityDefinition: EntityDefinition;
};

export type AlterEntityAttributeColumns = {
  addColumns?: { name: string; definition: JzodElement }[] | undefined;
  removeColumns?: string[] | undefined;
};

/**
 * Apply add/remove column updates to an mlSchema object definition.
 * `removeColumns` drops matching keys; `addColumns` overlays/adds attributes.
 */
export function applyMlSchemaColumnChanges(
  mlSchema: JzodObject,
  changes: AlterEntityAttributeColumns,
): JzodObject {
  const removeColumns = changes.removeColumns ?? [];
  const baseDefinition =
    removeColumns.length > 0
      ? Object.fromEntries(
          Object.entries(mlSchema.definition).filter(
            ([attributeName]) => !removeColumns.includes(attributeName),
          ),
        )
      : mlSchema.definition;

  const added = changes.addColumns
    ? Object.fromEntries(changes.addColumns.map((column) => [column.name, column.definition]))
    : {};

  return {
    ...mlSchema,
    definition: {
      ...baseDefinition,
      ...added,
    },
  };
}

function assertDualWriteEquality(pair: EntityEntityDefinitionPair): EntityEntityDefinitionPair {
  const comparison = compareEntityPresentModelDefinitions(
    pair.entity,
    pair.entityDefinition,
  );
  if (!comparison.equal) {
    throw new Error(
      `Entity/EntityDefinition dual-write divergence for ${pair.entity.uuid} (${pair.entity.name}): ${comparison.differingFields.join(", ")}`,
    );
  }
  return pair;
}

/**
 * Create-path adapter: Entity is authoritative when complete; legacy incomplete
 * Entity is enriched from EntityDefinition, then ED is aligned from Entity.
 */
export function normalizeCreateEntityPair(
  entity: Entity,
  entityDefinition: EntityDefinition,
): EntityEntityDefinitionPair {
  const authoritativeEntity = entityHasCompletePresentModel(entity)
    ? entity
    : resolveCurrentEntityModel(entity, [entityDefinition]);
  const alignedEntityDefinition = alignEntityDefinitionToPresentEntity(
    authoritativeEntity,
    entityDefinition,
  );
  return assertDualWriteEquality({
    entity: authoritativeEntity,
    entityDefinition: alignedEntityDefinition,
  });
}

/**
 * Alter-attribute: mutate Entity.mlSchema, dual-write redundant EntityDefinition.
 */
export function applyAlterEntityAttributePair(
  entity: Entity,
  entityDefinition: EntityDefinition,
  changes: AlterEntityAttributeColumns,
): EntityEntityDefinitionPair {
  const resolvedEntity = resolveCurrentEntityModel(entity, [entityDefinition], {
    onInconsistency: "preferEntity",
  });
  if (!resolvedEntity.mlSchema) {
    throw new Error(
      `applyAlterEntityAttributePair: Entity ${entity.uuid} has no mlSchema after resolution`,
    );
  }
  const nextEntity: Entity = {
    ...resolvedEntity,
    mlSchema: applyMlSchemaColumnChanges(resolvedEntity.mlSchema, changes),
  };
  const nextEntityDefinition = alignEntityDefinitionToPresentEntity(
    nextEntity,
    entityDefinition,
  );
  return assertDualWriteEquality({
    entity: nextEntity,
    entityDefinition: nextEntityDefinition,
  });
}

/**
 * Rename: update both Entity and redundant EntityDefinition names; keep definition fields aligned.
 */
export function applyRenameEntityPair(
  entity: Entity,
  entityDefinition: EntityDefinition,
  targetName: string,
): EntityEntityDefinitionPair {
  const resolvedEntity = resolveCurrentEntityModel(entity, [entityDefinition], {
    onInconsistency: "preferEntity",
  });
  const renamedEntity: Entity = {
    ...resolvedEntity,
    name: targetName,
  };
  const renamedEntityDefinition = alignEntityDefinitionToPresentEntity(renamedEntity, {
    ...entityDefinition,
    name: targetName,
  });
  return assertDualWriteEquality({
    entity: renamedEntity,
    entityDefinition: renamedEntityDefinition,
  });
}
