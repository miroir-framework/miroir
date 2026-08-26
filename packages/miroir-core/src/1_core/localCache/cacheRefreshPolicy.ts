import type {
  ApplicationSection,
  Entity,
  EntityVersion,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getApplicationSection } from "../Model.js";

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

/** Marker substring from PersistenceStoreController when modelVersion is omitted (#232/#234). */
export const MISSING_MODEL_VERSION_SECTION_MARKER =
  "modelVersion section is not configured";

/**
 * True when an Action2Error (or nested innerError chain) reports an absent modelVersion
 * section. Persistence wrappers often bury the marker under FailedToHandlePersistenceAction.
 */
export function isAbsentModelVersionSectionError(error: unknown): boolean {
  const seen = new Set<unknown>();
  const walk = (value: unknown): boolean => {
    if (value == null || seen.has(value)) {
      return false;
    }
    if (typeof value !== "object") {
      return typeof value === "string" && value.includes(MISSING_MODEL_VERSION_SECTION_MARKER);
    }
    seen.add(value);
    const record = value as {
      errorMessage?: unknown;
      message?: unknown;
      innerError?: unknown;
    };
    if (
      typeof record.errorMessage === "string" &&
      record.errorMessage.includes(MISSING_MODEL_VERSION_SECTION_MARKER)
    ) {
      return true;
    }
    if (
      typeof record.message === "string" &&
      record.message.includes(MISSING_MODEL_VERSION_SECTION_MARKER)
    ) {
      return true;
    }
    if (Array.isArray(record.innerError)) {
      return record.innerError.some(walk);
    }
    return walk(record.innerError);
  };
  return walk(error);
}

/**
 * Builds the refresh fetch list.
 * - Model-catalog entities are always included (application concepts must be fully available).
 * - Non-model entities are included only when shouldCacheAllInstancesOnRefresh is true.
 * - Section routing uses getApplicationSection for every entity (#232: version-history →
 *   modelVersion). Do not hardcode "model" for the modelEntities list — satellite apps pass
 *   metaModelEntities there, which includes VH parents; SQL then SELECTs missing tables (#234).
 *
 * #217 Phase 7: reads Entity.cache first; optional EntityVersion map is legacy fallback.
 */
export function resolveEntitiesToFetchOnRefresh(
  applicationUuid: string,
  modelEntities: Entity[],
  dataEntities: Entity[],
  entityDefinitionsByEntityUuid: Record<string, EntityVersion> = {},
): EntityFetchOnRefresh[] {
  const modelFetches: EntityFetchOnRefresh[] = modelEntities.map((entity) => ({
    section: getApplicationSection(applicationUuid, entity.uuid!),
    entity,
  }));

  const nonModelFetches: EntityFetchOnRefresh[] = dataEntities
    .filter((entity) =>
      shouldCacheAllInstancesOnRefresh(
        resolveCachePolicyCarrierForEntity(entity, entityDefinitionsByEntityUuid),
      ),
    )
    .map((entity) => ({
      section: getApplicationSection(applicationUuid, entity.uuid!),
      entity,
    }));

  return [...modelFetches, ...nonModelFetches];
}
