/**
 * Issue #217 Phase 0 — present-model characterization helpers.
 *
 * Pure inventory / projection / consistency utilities for the Entity ↔
 * EntityDefinition migration. No runtime resolution or dual-write yet.
 */

import deepEqual from "fast-deep-equal";

import type {
  Entity,
  EntityDefinition,
  JzodObject,
  MiroirIcon,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

/**
 * Definition-bearing fields that live on EntityDefinition today and must
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
 * Characterizes Entity ↔ EntityDefinition joins by `entityDefinition.entityUuid`.
 * Does not pick a "current" definition when multiples exist.
 */
export function inventoryEntityEntityDefinitionJoins(
  entities: Entity[],
  entityDefinitions: EntityDefinition[],
): EntityEntityDefinitionJoinInventory {
  const entityByUuid = new Map(entities.map((entity) => [entity.uuid, entity]));
  const definitionsByEntityUuid = new Map<string, EntityDefinition[]>();

  for (const entityDefinition of entityDefinitions) {
    const existing = definitionsByEntityUuid.get(entityDefinition.entityUuid);
    if (existing) {
      existing.push(entityDefinition);
    } else {
      definitionsByEntityUuid.set(entityDefinition.entityUuid, [entityDefinition]);
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

  const orphanEntityDefinitions = entityDefinitions
    .filter((entityDefinition) => !entityByUuid.has(entityDefinition.entityUuid))
    .map((entityDefinition) => ({
      uuid: entityDefinition.uuid,
      name: entityDefinition.name,
      entityUuid: entityDefinition.entityUuid,
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
 * (Entity-side vs EntityDefinition-side during dual-write).
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
   * EntityDefinition but overlapping fields differ:
   * - `error` (default): throw `EntityPresentModelResolutionError`
   * - `preferEntity`: return the Entity (Entity-authoritative)
   */
  onInconsistency?: "error" | "preferEntity";
};

/**
 * Present-model completeness for #217 Phase 2: Entity carries `mlSchema`.
 * Other definition fields may still be filled from EntityDefinition.
 */
export function entityHasCompletePresentModel(entity: Entity): boolean {
  return (
    Object.prototype.hasOwnProperty.call(entity, "mlSchema") &&
    entity.mlSchema != null
  );
}

function matchingEntityDefinitionsForEntity(
  entity: Entity,
  legacyEntityDefinitions: EntityDefinition[],
): EntityDefinition[] {
  return legacyEntityDefinitions.filter(
    (entityDefinition) => entityDefinition.entityUuid === entity.uuid,
  );
}

/**
 * Fields present on Entity that also exist on EntityDefinition and differ.
 * Fields only on EntityDefinition are ignored (not yet copied onto Entity).
 */
export function overlappingPresentModelDifferences(
  entity: Entity,
  entityDefinition: EntityDefinition,
): EntityPresentModelDefinitionField[] {
  const entityProjection = projectEntityPresentModelDefinition(entity);
  const definitionProjection = projectEntityPresentModelDefinition(entityDefinition);
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
  entityDefinition: EntityDefinition,
): Entity {
  const fromDefinition = projectEntityPresentModelDefinition(entityDefinition);
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
 * - incomplete Entity + one matching EntityDefinition → in-memory enriched Entity
 * - ambiguous definitions → error
 * - incomplete with no definition → error
 */
export function resolveCurrentEntityModel(
  entity: Entity,
  legacyEntityDefinitions: EntityDefinition[],
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
          `Entity ${entity.uuid} (${entity.name}) definition fields diverge from EntityDefinition ${matching[0].uuid}: ${differingFields.join(", ")}`,
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
      `Entity ${entity.uuid} (${entity.name}) is incomplete (no mlSchema) and has no matching EntityDefinition fallback.`,
    );
  }

  return enrichEntityFromLegacyDefinition(entity, matching[0]);
}

/**
 * Dual-write helper: copy Entity present-model definition fields onto the
 * redundant EntityDefinition while preserving EntityDefinition identity UUIDs.
 */
export function alignEntityDefinitionToPresentEntity(
  entity: Entity,
  entityDefinition: EntityDefinition,
): EntityDefinition {
  const definitionProjection = projectEntityPresentModelDefinition(entity);
  const aligned: EntityDefinition = {
    ...entityDefinition,
    ...definitionProjection,
    uuid: entityDefinition.uuid,
    entityUuid: entity.uuid,
    name: entity.name,
    mlSchema: entity.mlSchema ?? entityDefinition.mlSchema,
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
  entityDefinitions: EntityDefinition[],
): Entity[] {
  return entities.map((entity) => {
    try {
      return resolveCurrentEntityModel(entity, entityDefinitions, {
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
 * using EntityDefinitions only when needed. Call sites must not
 * `entityDefinitions.find(ed => ed.entityUuid === …)` for live schema/PK.
 */
export function resolvePresentEntityFromModel(
  model:
    | {
        entities?: Entity[] | undefined;
        entityDefinitions?: EntityDefinition[] | undefined;
      }
    | null
    | undefined,
  entityUuid: string,
  options?: ResolveCurrentEntityModelOptions,
): Entity | undefined {
  if (!model || !entityUuid) {
    return undefined;
  }
  const entities = model.entities ?? [];
  const entityDefinitions = model.entityDefinitions ?? [];
  const entity = entities.find((candidate) => candidate.uuid === entityUuid);

  if (entity) {
    try {
      return resolveCurrentEntityModel(entity, entityDefinitions, {
        onInconsistency: "preferEntity",
        ...options,
      });
    } catch {
      return entityHasCompletePresentModel(entity) ? entity : undefined;
    }
  }

  const matching = entityDefinitions.filter(
    (entityDefinition) => entityDefinition.entityUuid === entityUuid,
  );
  if (matching.length !== 1) {
    return undefined;
  }
  try {
    return resolveCurrentEntityModel(
      {
        uuid: entityUuid,
        name: matching[0]!.name,
        parentName: "Entity",
        parentUuid: ENTITY_PARENT_UUID,
      } as Entity,
      matching,
      options,
    );
  } catch {
    return undefined;
  }
}

/**
 * #217 Phase 9/12 — UI/tooling boundary: project present Entity onto EntityVersion /
 * EntityDefinition shape for legacy callers still typed that way.
 *
 * Prefer passing Entity (with mlSchema) directly. UI Report/grid paths no longer use this.
 *
 * @deprecated Prefer Entity present-model fields; keep only for non-UI dual-write / compat.
 */
export function presentEntityAsRedundantEntityDefinition(
  entity: Entity,
  entityDefinitions: EntityDefinition[] = [],
): EntityDefinition {
  const existing = entityDefinitions.find(
    (entityDefinition) => entityDefinition.entityUuid === entity.uuid,
  );
  if (existing) {
    return alignEntityDefinitionToPresentEntity(entity, existing);
  }
  if (!entity.mlSchema) {
    throw new Error(
      `presentEntityAsRedundantEntityDefinition: Entity ${entity.uuid} (${entity.name}) has no mlSchema`,
    );
  }
  return {
    uuid: entity.uuid,
    parentName: "EntityVersion",
    parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
    name: entity.name,
    entityUuid: entity.uuid,
    conceptLevel: "Model",
    mlSchema: entity.mlSchema,
    ...(entity.viewAttributes !== undefined
      ? { viewAttributes: entity.viewAttributes }
      : {}),
    ...(entity.defaultInstanceDetailsReportUuid !== undefined
      ? { defaultInstanceDetailsReportUuid: entity.defaultInstanceDetailsReportUuid }
      : {}),
    ...(entity.idAttribute !== undefined ? { idAttribute: entity.idAttribute } : {}),
    ...(entity.display !== undefined ? { display: entity.display } : {}),
    ...(entity.cache !== undefined ? { cache: entity.cache } : {}),
    ...(entity.icon !== undefined ? { icon: entity.icon } : {}),
  } as EntityDefinition;
}
