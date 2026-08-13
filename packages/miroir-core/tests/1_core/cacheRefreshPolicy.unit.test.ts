import { describe, expect, it } from "vitest";

import {
  isLazyCacheOnRefreshEntity,
  resolveEntitiesToFetchOnRefresh,
  shouldCacheAllInstancesOnRefresh,
} from "../../src/1_core/localCache/cacheRefreshPolicy.js";
import type {
  ApplicationSection,
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

function entity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentName: "Entity",
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  } as Entity;
}

function entityVersion(
  entityUuid: string,
  cacheAllInstancesOnRefresh?: boolean,
): EntityVersion {
  return {
    uuid: `def-${entityUuid}`,
    name: `Def-${entityUuid}`,
    entityUuid,
    parentName: "EntityVersion",
    parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
    mlSchema: { type: "object", definition: {} },
    ...(cacheAllInstancesOnRefresh === undefined
      ? {}
      : { cache: { cacheAllInstancesOnRefresh } }),
  } as EntityVersion;
}

describe("shouldCacheAllInstancesOnRefresh (1.1 default eager)", () => {
  it("returns true when EntityVersion is missing", () => {
    expect(shouldCacheAllInstancesOnRefresh(undefined)).toBe(true);
  });

  it("returns true when Entity.cache is absent (Entity-authoritative carrier)", () => {
    expect(shouldCacheAllInstancesOnRefresh(entity("e1", "Book"))).toBe(true);
  });

  it("returns false when Entity.cache.cacheAllInstancesOnRefresh is false", () => {
    expect(
      shouldCacheAllInstancesOnRefresh({
        ...entity("e1", "Blob"),
        cache: { cacheAllInstancesOnRefresh: false },
      }),
    ).toBe(false);
  });

  it("returns true when cacheAllInstancesOnRefresh is true", () => {
    expect(shouldCacheAllInstancesOnRefresh(entityVersion("e1", true))).toBe(true);
  });

  it("returns false when cacheAllInstancesOnRefresh is false", () => {
    expect(shouldCacheAllInstancesOnRefresh(entityVersion("e1", false))).toBe(false);
  });

  it("isLazyCacheOnRefreshEntity is true only for explicit false", () => {
    expect(isLazyCacheOnRefreshEntity(undefined)).toBe(false);
    expect(isLazyCacheOnRefreshEntity(entityVersion("e1"))).toBe(false);
    expect(isLazyCacheOnRefreshEntity(entityVersion("e1", true))).toBe(false);
    expect(isLazyCacheOnRefreshEntity(entityVersion("e1", false))).toBe(true);
  });
});

describe("resolveEntitiesToFetchOnRefresh (1.2–1.3)", () => {
  const applicationUuid = "00000000-0000-4000-8000-000000000001";
  const modelA = entity("model-a", "Entity");
  const modelB = entity("model-b", "EntityVersion");
  const dataEager = entity("data-eager", "Book");
  const dataLazy = entity("data-lazy", "Blob");
  const dataDefault = entity("data-default", "Author");

  const definitionsByEntityUuid: Record<string, EntityVersion> = {
    "data-eager": entityVersion("data-eager", true),
    "data-lazy": entityVersion("data-lazy", false),
    // data-default intentionally omitted → default eager
  };

  it("always includes every model entity regardless of cache flags", () => {
    const result = resolveEntitiesToFetchOnRefresh(
      applicationUuid,
      [modelA, modelB],
      [dataLazy],
      {
        "data-lazy": entityVersion("data-lazy", false),
        "model-a": entityVersion("model-a", false),
        "model-b": entityVersion("model-b", false),
      },
    );

    const modelUuids = result
      .filter((e) => e.section === "model")
      .map((e) => e.entity.uuid);
    expect(modelUuids).toEqual(["model-a", "model-b"]);
  });

  it("includes data entities whose cacheAllInstancesOnRefresh is true or absent", () => {
    const result = resolveEntitiesToFetchOnRefresh(
      applicationUuid,
      [modelA],
      [dataEager, dataDefault, dataLazy],
      definitionsByEntityUuid,
    );

    const dataUuids = result
      .filter((e) => e.section === "data")
      .map((e) => e.entity.uuid);
    expect(dataUuids).toEqual(["data-eager", "data-default"]);
  });

  it("excludes data entities with cacheAllInstancesOnRefresh false", () => {
    const result = resolveEntitiesToFetchOnRefresh(
      applicationUuid,
      [],
      [dataLazy],
      definitionsByEntityUuid,
    );

    expect(result).toEqual([]);
  });

  it("excludes Miroir Blob when EntityVersion asset sets cacheAllInstancesOnRefresh false (Phase 4)", async () => {
    const { entityBlob, entityDefinitionBlob, selfApplicationMiroir } = await import(
      "miroir-test-app_deployment-miroir"
    );
    expect(entityDefinitionBlob.cache?.cacheAllInstancesOnRefresh).toBe(false);

    const result = resolveEntitiesToFetchOnRefresh(
      selfApplicationMiroir.uuid as string,
      [],
      [entityBlob as Entity],
      { [entityBlob.uuid]: entityDefinitionBlob as EntityVersion },
    );

    expect(result).toEqual([]);
  });

  it("excludes Blob from Entity.cache without EntityVersion map (Phase 7)", async () => {
    const { entityBlob, selfApplicationMiroir } = await import(
      "miroir-test-app_deployment-miroir"
    );
    expect(entityBlob.cache?.cacheAllInstancesOnRefresh).toBe(false);

    const result = resolveEntitiesToFetchOnRefresh(
      selfApplicationMiroir.uuid as string,
      [],
      [entityBlob as Entity],
    );
    expect(result).toEqual([]);
  });

  it("routes version-history entities to modelVersion (#232)", async () => {
    const { entitySelfApplicationVersion, selfApplicationMiroir } = await import(
      "miroir-test-app_deployment-miroir"
    );

    const result = resolveEntitiesToFetchOnRefresh(
      selfApplicationMiroir.uuid as string,
      [],
      [entitySelfApplicationVersion as Entity],
    );

    expect(result).toEqual([
      {
        section: "modelVersion" as ApplicationSection,
        entity: entitySelfApplicationVersion,
      },
    ]);
  });

  it("tags sections correctly on the fetch list", () => {
    const result = resolveEntitiesToFetchOnRefresh(
      applicationUuid,
      [modelA],
      [dataEager],
      definitionsByEntityUuid,
    );

    expect(result).toEqual([
      { section: "model" as ApplicationSection, entity: modelA },
      { section: "data" as ApplicationSection, entity: dataEager },
    ]);
  });
});
