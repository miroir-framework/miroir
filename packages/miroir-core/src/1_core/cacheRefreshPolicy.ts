import type {
  ApplicationSection,
  Entity,
  EntityVersion,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export type EntityFetchOnRefresh = {
  section: ApplicationSection;
  entity: Entity;
};

/**
 * Anything that may carry cache refresh policy (#217 Phase 7: Entity-authoritative;
 * EntityVersion remains a compatibility fallback).
 */
export type CachePolicyCarrier =
  | { cache?: { cacheAllInstancesOnRefresh?: boolean | undefined } | undefined }
  | undefined;

/**
 * Interprets cache.cacheAllInstancesOnRefresh on Entity (preferred) or EntityVersion.
 * Absent carrier or absent/true flag ⇒ eager (load all instances on refresh).
 * Explicit false ⇒ load none of that entity's instances on refresh.
 */
export function shouldCacheAllInstancesOnRefresh(
  carrier: CachePolicyCarrier,
): boolean {
  return carrier?.cache?.cacheAllInstancesOnRefresh !== false;
}

/** True when the entity is intentionally skipped on refresh (report-triggered load). */
export function isLazyCacheOnRefreshEntity(
  carrier: CachePolicyCarrier,
): boolean {
  return carrier?.cache?.cacheAllInstancesOnRefresh === false;
}

/**
 * Prefer Entity.cache; fall back to EntityVersion map for incomplete/legacy Entities.
 */
export function resolveCachePolicyCarrierForEntity(
  entity: Entity,
  entityDefinitionsByEntityUuid?: Record<string, EntityVersion> | undefined,
): CachePolicyCarrier {
  if (entity.cache !== undefined) {
    return entity;
  }
  return entityDefinitionsByEntityUuid?.[entity.uuid];
}

/**
 * Builds the refresh fetch list.
 * - Model entities are always included (application concepts must be fully available).
 * - Data entities are included only when shouldCacheAllInstancesOnRefresh is true.
 *
 * #217 Phase 7: reads Entity.cache first; optional EntityVersion map is legacy fallback.
 */
export function resolveEntitiesToFetchOnRefresh(
  modelEntities: Entity[],
  dataEntities: Entity[],
  entityDefinitionsByEntityUuid: Record<string, EntityVersion> = {},
): EntityFetchOnRefresh[] {
  const modelFetches: EntityFetchOnRefresh[] = modelEntities.map((entity) => ({
    section: "model" as ApplicationSection,
    entity,
  }));

  const dataFetches: EntityFetchOnRefresh[] = dataEntities
    .filter((entity) =>
      shouldCacheAllInstancesOnRefresh(
        resolveCachePolicyCarrierForEntity(entity, entityDefinitionsByEntityUuid),
      ),
    )
    .map((entity) => ({
      section: "data" as ApplicationSection,
      entity,
    }));

  return [...modelFetches, ...dataFetches];
}
