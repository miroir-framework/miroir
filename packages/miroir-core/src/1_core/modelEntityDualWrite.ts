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
