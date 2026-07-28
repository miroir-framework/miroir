/**
 * Issue #217 Phase 5 — Entity-authoritative model mutations with dual-write.
 * Pure helpers: construct post-change Entity + redundant EntityVersion pairs
 * for alter/rename when Entity is incomplete.
 *
 * #220 — create-path dual-write (`normalizeCreateEntityPair`) removed; create is Entity-only.
 * Not for Application Version freeze (#216).
 */

import type {
  Entity,
  EntityVersion,
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
  entityVersion: EntityVersion;
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

/**
 * #217 Phase 11 — Entity-only alter when present model is complete (store layer).
 * Returns undefined when Entity is incomplete (caller may dual-write via ED).
 */
export function applyEntityOnlyAlterAttribute(
  entity: Entity,
  changes: AlterEntityAttributeColumns,
): Entity | undefined {
  if (!entityHasCompletePresentModel(entity) || !entity.mlSchema) {
    return undefined;
  }
  return {
    ...entity,
    mlSchema: applyMlSchemaColumnChanges(entity.mlSchema, changes),
  };
}

/**
 * #220 — Entity-only rename (store / planner). Always renames the live Entity;
 * never touches EntityVersion.
 */
export function applyEntityOnlyRename(
  entity: Entity,
  targetName: string,
): Entity {
  return {
    ...entity,
    name: targetName,
  };
}

function assertDualWriteEquality(pair: EntityEntityDefinitionPair): EntityEntityDefinitionPair {
  const comparison = compareEntityPresentModelDefinitions(
    pair.entity,
    pair.entityVersion,
  );
  if (!comparison.equal) {
    throw new Error(
      `Entity/EntityVersion dual-write divergence for ${pair.entity.uuid} (${pair.entity.name}): ${comparison.differingFields.join(", ")}`,
    );
  }
  return pair;
}

/**
 * Alter-attribute: mutate Entity.mlSchema, dual-write redundant EntityVersion.
 */
export function applyAlterEntityAttributePair(
  entity: Entity,
  entityVersion: EntityVersion,
  changes: AlterEntityAttributeColumns,
): EntityEntityDefinitionPair {
  const resolvedEntity = resolveCurrentEntityModel(entity, [entityVersion], {
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
    entityVersion,
  );
  return assertDualWriteEquality({
    entity: nextEntity,
    entityVersion: nextEntityDefinition,
  });
}

/**
 * Rename: update both Entity and redundant EntityVersion names; keep definition fields aligned.
 */
export function applyRenameEntityPair(
  entity: Entity,
  entityVersion: EntityVersion,
  targetName: string,
): EntityEntityDefinitionPair {
  const resolvedEntity = resolveCurrentEntityModel(entity, [entityVersion], {
    onInconsistency: "preferEntity",
  });
  const renamedEntity: Entity = {
    ...resolvedEntity,
    name: targetName,
  };
  const renamedEntityDefinition = alignEntityDefinitionToPresentEntity(renamedEntity, {
    ...entityVersion,
    name: targetName,
  });
  return assertDualWriteEquality({
    entity: renamedEntity,
    entityVersion: renamedEntityDefinition,
  });
}
