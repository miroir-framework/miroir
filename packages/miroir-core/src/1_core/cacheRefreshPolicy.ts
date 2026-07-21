import type {
  ApplicationSection,
  Entity,
  EntityDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export type EntityFetchOnRefresh = {
  section: ApplicationSection;
  entity: Entity;
};

/**
 * Interprets EntityDefinition.cache.cacheAllInstancesOnRefresh.
 * Absent definition or absent/true flag ⇒ eager (load all instances on refresh).
 * Explicit false ⇒ load none of that entity's instances on refresh.
 */
export function shouldCacheAllInstancesOnRefresh(
  entityDefinition: EntityDefinition | undefined,
): boolean {
  return entityDefinition?.cache?.cacheAllInstancesOnRefresh !== false;
}

/**
 * Builds the refresh fetch list.
 * - Model entities are always included (application concepts must be fully available).
 * - Data entities are included only when shouldCacheAllInstancesOnRefresh is true.
 */
export function resolveEntitiesToFetchOnRefresh(
  modelEntities: Entity[],
  dataEntities: Entity[],
  entityDefinitionsByEntityUuid: Record<string, EntityDefinition>,
): EntityFetchOnRefresh[] {
  const modelFetches: EntityFetchOnRefresh[] = modelEntities.map((entity) => ({
    section: "model" as ApplicationSection,
    entity,
  }));

  const dataFetches: EntityFetchOnRefresh[] = dataEntities
    .filter((entity) =>
      shouldCacheAllInstancesOnRefresh(entityDefinitionsByEntityUuid[entity.uuid]),
    )
    .map((entity) => ({
      section: "data" as ApplicationSection,
      entity,
    }));

  return [...modelFetches, ...dataFetches];
}
