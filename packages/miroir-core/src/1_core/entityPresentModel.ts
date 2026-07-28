/**
 * Issue #217 Phase 0 — present-model characterization helpers.
 *
 * Pure inventory / projection / consistency utilities for the Entity ↔
 * EntityVersion migration. No runtime resolution or dual-write yet.
 */

import deepEqual from "fast-deep-equal";

import type {
  Entity,
  EntityVersion,
  JzodObject,
  MiroirIcon,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

/**
 * Definition-bearing fields that live on EntityVersion today and must
 * eventually be carried by the authoritative live Entity (#217 §1.1).
 */
export const ENTITY_PRESENT_MODEL_DEFINITION_FIELDS = [
  "defaultInstanceDetailsReportUuid",
  "viewAttributes",
  "icon",
  "display",
  "cache",
  "idAttribute",
  "externalDataSource",
  "mlSchema",
] as const;

export type EntityPresentModelDefinitionField =
  (typeof ENTITY_PRESENT_MODEL_DEFINITION_FIELDS)[number];

export type EntityPresentModelDefinitionProjection = {
  defaultInstanceDetailsReportUuid?: string | undefined;
  viewAttributes?: string[] | undefined;
  icon?: MiroirIcon | undefined;
  display?: {
    foldSubLevels?: {
      [x: string]: boolean;
    } | undefined;
  } | undefined;
  cache?: {
    cacheAllInstancesOnRefresh?: boolean | undefined;
  } | undefined;
  idAttribute?: (string | string[]) | undefined;
  externalDataSource?: {
    schema?: string | undefined;
    tableName?: string | undefined;
  } | undefined;
  mlSchema?: JzodObject | undefined;
};

export type EntityEntityDefinitionJoinMatch = {
  entityUuid: string;
  entityDefinitionUuids: string[];
};

export type EntityEntityDefinitionJoinInventory = {
  matched: EntityEntityDefinitionJoinMatch[];
  orphanEntities: Array<{ uuid: string; name: string }>;
  orphanEntityDefinitions: Array<{ uuid: string; name: string; entityUuid: string }>;
  multipleDefinitions: EntityEntityDefinitionJoinMatch[];
};

/**
 * Characterizes Entity ↔ EntityVersion joins by `entityVersion.entityUuid`.
 * Does not pick a "current" definition when multiples exist.
 */
export function inventoryEntityEntityDefinitionJoins(
  entities: Entity[],
  entityVersions: EntityVersion[],
): EntityEntityDefinitionJoinInventory {
  const entityByUuid = new Map(entities.map((entity) => [entity.uuid, entity]));
  const definitionsByEntityUuid = new Map<string, EntityVersion[]>();

  for (const entityVersion of entityVersions) {
    const existing = definitionsByEntityUuid.get(entityVersion.entityUuid);
    if (existing) {
      existing.push(entityVersion);
    } else {
      definitionsByEntityUuid.set(entityVersion.entityUuid, [entityVersion]);
    }
  }

  const matched: EntityEntityDefinitionJoinMatch[] = [];
  const multipleDefinitions: EntityEntityDefinitionJoinMatch[] = [];
  const orphanEntities: Array<{ uuid: string; name: string }> = [];

  for (const entity of entities) {
    const definitions = definitionsByEntityUuid.get(entity.uuid) ?? [];
    if (definitions.length === 0) {
      orphanEntities.push({ uuid: entity.uuid, name: entity.name });
      continue;
    }
    const entityDefinitionUuids = definitions.map((definition) => definition.uuid).sort();
    const entry = { entityUuid: entity.uuid, entityDefinitionUuids };
    if (definitions.length === 1) {
      matched.push(entry);
    } else {
      multipleDefinitions.push(entry);
    }
  }

  const orphanEntityDefinitions = entityVersions
    .filter((entityVersion) => !entityByUuid.has(entityVersion.entityUuid))
    .map((entityVersion) => ({
      uuid: entityVersion.uuid,
      name: entityVersion.name,
      entityUuid: entityVersion.entityUuid,
    }))
    .sort((left, right) => left.uuid.localeCompare(right.uuid));

  matched.sort((left, right) => left.entityUuid.localeCompare(right.entityUuid));
  multipleDefinitions.sort((left, right) => left.entityUuid.localeCompare(right.entityUuid));
  orphanEntities.sort((left, right) => left.uuid.localeCompare(right.uuid));

  return {
    matched,
    orphanEntities,
    orphanEntityDefinitions,
    multipleDefinitions,
  };
}

export function projectEntityPresentModelDefinition(
  source: Partial<EntityPresentModelDefinitionProjection> | null | undefined,
): EntityPresentModelDefinitionProjection {
  if (!source) {
    return {};
  }
  const projection: EntityPresentModelDefinitionProjection = {};
  for (const field of ENTITY_PRESENT_MODEL_DEFINITION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      (projection as Record<string, unknown>)[field] = (source as Record<string, unknown>)[field];
    }
  }
  return projection;
}

export type EntityPresentModelDefinitionComparison = {
  equal: boolean;
  differingFields: EntityPresentModelDefinitionField[];
};

/**
 * Deep-compares definition-bearing fields between two projections
 * (Entity-side vs EntityVersion-side during dual-write).
 * Absent on both sides is equal; present-vs-absent is a difference.
 */
export function compareEntityPresentModelDefinitions(
  left: Partial<EntityPresentModelDefinitionProjection> | null | undefined,
  right: Partial<EntityPresentModelDefinitionProjection> | null | undefined,
): EntityPresentModelDefinitionComparison {
  const leftProjection = projectEntityPresentModelDefinition(left);
  const rightProjection = projectEntityPresentModelDefinition(right);
  const differingFields: EntityPresentModelDefinitionField[] = [];

  for (const field of ENTITY_PRESENT_MODEL_DEFINITION_FIELDS) {
    const leftHas = Object.prototype.hasOwnProperty.call(leftProjection, field);
    const rightHas = Object.prototype.hasOwnProperty.call(rightProjection, field);
    if (!leftHas && !rightHas) {
      continue;
    }
    if (!deepEqual(leftProjection[field], rightProjection[field])) {
      differingFields.push(field);
    }
  }

  return {
    equal: differingFields.length === 0,
    differingFields,
  };
}

/** Creation-time versioning capability fixtures (#217 §3.4). */
export const VERSIONED_APPLICATION_FIXTURE = {
  versioningEnabled: true as const,
};

export const UNVERSIONED_APPLICATION_FIXTURE = {
  versioningEnabled: false as const,
};

/**
 * Policy contract (#217 §11.1): `versioningEnabled` is immutable after creation.
 * Call sites that update SelfApplication must invoke this before persisting.
 * Runtime Action wiring is later phases; this encodes the invariant now.
 */
export function assertVersioningEnabledImmutable(
  before: { versioningEnabled?: boolean | undefined },
  after: { versioningEnabled?: boolean | undefined },
): void {
  if (before.versioningEnabled !== after.versioningEnabled) {
    throw new Error(
      `SelfApplication.versioningEnabled is immutable (was ${String(before.versioningEnabled)}, attempted ${String(after.versioningEnabled)})`,
    );
  }
}

/**
 * Single hub for live present-model lookup by Entity UUID.
 * Entity is the sole source for an instance structure and its present-model fields.
 */
export function resolvePresentEntityFromModel(
  model:
    | {
        entities?: Entity[] | undefined;
      }
    | null
    | undefined,
  entityUuid: string,
): Entity | undefined {
  if (!model || !entityUuid) {
    return undefined;
  }
  return model.entities?.find((candidate) => candidate.uuid === entityUuid);
}

