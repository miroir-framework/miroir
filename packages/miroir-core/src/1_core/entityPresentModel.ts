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

export type EntityPresentModelResolutionErrorCode =
  | "ambiguous"
  | "missingDefinition"
  | "inconsistent";

export class EntityPresentModelResolutionError extends Error {
  readonly code: EntityPresentModelResolutionErrorCode;
  readonly entityUuid: string;
  readonly details?: unknown;

  constructor(
    code: EntityPresentModelResolutionErrorCode,
    entityUuid: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "EntityPresentModelResolutionError";
    this.code = code;
    this.entityUuid = entityUuid;
    this.details = details;
  }
}

export type ResolveCurrentEntityModelOptions = {
  /**
   * When Entity is complete (`mlSchema` present) and overlaps with a legacy
   * EntityVersion but overlapping fields differ:
   * - `error` (default): throw `EntityPresentModelResolutionError`
   * - `preferEntity`: return the Entity (Entity-authoritative)
   */
  onInconsistency?: "error" | "preferEntity";
};

/**
 * Present-model completeness for #217 Phase 2: Entity carries `mlSchema`.
 * Other definition fields may still be filled from EntityVersion.
 */
export function entityHasCompletePresentModel(entity: Entity): boolean {
  return (
    Object.prototype.hasOwnProperty.call(entity, "mlSchema") &&
    entity.mlSchema != null
  );
}

function matchingEntityDefinitionsForEntity(
  entity: Entity,
  legacyEntityDefinitions: EntityVersion[],
): EntityVersion[] {
  return legacyEntityDefinitions.filter(
    (entityVersion) => entityVersion.entityUuid === entity.uuid,
  );
}

/**
 * Fields present on Entity that also exist on EntityVersion and differ.
 * Fields only on EntityVersion are ignored (not yet copied onto Entity).
 */
export function overlappingPresentModelDifferences(
  entity: Entity,
  entityVersion: EntityVersion,
): EntityPresentModelDefinitionField[] {
  const entityProjection = projectEntityPresentModelDefinition(entity);
  const definitionProjection = projectEntityPresentModelDefinition(entityVersion);
  const differingFields: EntityPresentModelDefinitionField[] = [];

  for (const field of ENTITY_PRESENT_MODEL_DEFINITION_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(entityProjection, field)) {
      continue;
    }
    if (!deepEqual(entityProjection[field], definitionProjection[field])) {
      differingFields.push(field);
    }
  }
  return differingFields;
}

function enrichEntityFromLegacyDefinition(
  entity: Entity,
  entityVersion: EntityVersion,
): Entity {
  const fromDefinition = projectEntityPresentModelDefinition(entityVersion);
  const fromEntity = projectEntityPresentModelDefinition(entity);
  return {
    ...entity,
    ...fromDefinition,
    ...fromEntity,
  };
}

/**
 * Entity-first present-model resolver (#217 Phase 2).
 *
 * - complete Entity (`mlSchema` present) → return Entity (optionally consistency-checked)
 * - incomplete Entity + one matching EntityVersion → in-memory enriched Entity
 * - ambiguous definitions → error
 * - incomplete with no definition → error
 */
export function resolveCurrentEntityModel(
  entity: Entity,
  legacyEntityDefinitions: EntityVersion[],
  options?: ResolveCurrentEntityModelOptions,
): Entity {
  const matching = matchingEntityDefinitionsForEntity(entity, legacyEntityDefinitions);
  if (matching.length > 1) {
    throw new EntityPresentModelResolutionError(
      "ambiguous",
      entity.uuid,
      `Entity ${entity.uuid} (${entity.name}) has ${matching.length} EntityDefinitions; expected at most one current definition.`,
      { entityDefinitionUuids: matching.map((definition) => definition.uuid) },
    );
  }

  const onInconsistency = options?.onInconsistency ?? "error";

  if (entityHasCompletePresentModel(entity)) {
    if (matching.length === 1) {
      const differingFields = overlappingPresentModelDifferences(entity, matching[0]);
      if (differingFields.length > 0) {
        if (onInconsistency === "preferEntity") {
          return entity;
        }
        throw new EntityPresentModelResolutionError(
          "inconsistent",
          entity.uuid,
          `Entity ${entity.uuid} (${entity.name}) definition fields diverge from EntityVersion ${matching[0].uuid}: ${differingFields.join(", ")}`,
          { differingFields, entityVersionUuid: matching[0].uuid },
        );
      }
    }
    return entity;
  }

  if (matching.length === 0) {
    throw new EntityPresentModelResolutionError(
      "missingDefinition",
      entity.uuid,
      `Entity ${entity.uuid} (${entity.name}) is incomplete (no mlSchema) and has no matching EntityVersion fallback.`,
    );
  }

  return enrichEntityFromLegacyDefinition(entity, matching[0]);
}

/**
 * Dual-write helper: copy Entity present-model definition fields onto the
 * redundant EntityVersion while preserving EntityVersion identity UUIDs.
 */
export function alignEntityDefinitionToPresentEntity(
  entity: Entity,
  entityVersion: EntityVersion,
): EntityVersion {
  const definitionProjection = projectEntityPresentModelDefinition(entity);
  const aligned: EntityVersion = {
    ...entityVersion,
    ...definitionProjection,
    uuid: entityVersion.uuid,
    entityUuid: entity.uuid,
    name: entity.name,
    mlSchema: entity.mlSchema ?? entityVersion.mlSchema,
  };
  for (const field of ENTITY_PRESENT_MODEL_DEFINITION_FIELDS) {
    if (
      !Object.prototype.hasOwnProperty.call(definitionProjection, field) &&
      field !== "mlSchema"
    ) {
      delete (aligned as Record<string, unknown>)[field];
    }
  }
  return aligned;
}

/**
 * #217 Phase 7 — assemble live MetaModel.entities as complete present models.
 * Incomplete Entities are enriched from EntityDefinitions; EntityDefinitions stay
 * loaded as compatibility/history and are not removed from MetaModel.
 */
export function assembleLivePresentModelEntities(
  entities: Entity[],
  entityVersions: EntityVersion[],
): Entity[] {
  return entities.map((entity) => {
    try {
      return resolveCurrentEntityModel(entity, entityVersions, {
        onInconsistency: "preferEntity",
      });
    } catch {
      return entity;
    }
  });
}

const ENTITY_PARENT_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

/**
 * #217 Phase 8 — single hub for live present-model lookup by entity UUID.
 * Prefer MetaModel.entities (assembled); fall back through `resolveCurrentEntityModel`
 * using EntityVersions only when needed. Call sites must not
 * `entityVersions.find(ed => ed.entityUuid === …)` for live schema/PK.
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
  const entities = model.entities ?? [];
  const entity = entities.find((candidate) => candidate.uuid === entityUuid);

  // return entity;
  if (!entity && entities && entities.length > 0) {
    throw new Error(`resolvePresentEntityFromModel: Entity ${entityUuid} not found in model`);
  } else {
    return entity;
  }
}

