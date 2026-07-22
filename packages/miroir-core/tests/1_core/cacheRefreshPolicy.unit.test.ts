import { describe, expect, it } from "vitest";

import {
  isLazyCacheOnRefreshEntity,
  resolveEntitiesToFetchOnRefresh,
  shouldCacheAllInstancesOnRefresh,
} from "../../src/1_core/cacheRefreshPolicy.js";
import type {
  ApplicationSection,
  Entity,
  EntityDefinition,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

function entity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentName: "Entity",
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  } as Entity;
}

function entityDefinition(
  entityUuid: string,
  cacheAllInstancesOnRefresh?: boolean,
): EntityDefinition {
  return {
    uuid: `def-${entityUuid}`,
    name: `Def-${entityUuid}`,
    entityUuid,
    parentName: "EntityDefinition",
    parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
    mlSchema: { type: "object", definition: {} },
    ...(cacheAllInstancesOnRefresh === undefined
      ? {}
      : { cache: { cacheAllInstancesOnRefresh } }),
  } as EntityDefinition;
}

describe("shouldCacheAllInstancesOnRefresh (1.1 default eager)", () => {
  it("returns true when EntityDefinition is missing", () => {
    expect(shouldCacheAllInstancesOnRefresh(undefined)).toBe(true);
  });

  it("returns true when cache options are absent", () => {
    expect(shouldCacheAllInstancesOnRefresh(entityDefinition("e1"))).toBe(true);
  });

  it("returns true when cacheAllInstancesOnRefresh is true", () => {
    expect(shouldCacheAllInstancesOnRefresh(entityDefinition("e1", true))).toBe(true);
  });

  it("returns false when cacheAllInstancesOnRefresh is false", () => {
    expect(shouldCacheAllInstancesOnRefresh(entityDefinition("e1", false))).toBe(false);
  });

  it("isLazyCacheOnRefreshEntity is true only for explicit false", () => {
    expect(isLazyCacheOnRefreshEntity(undefined)).toBe(false);
    expect(isLazyCacheOnRefreshEntity(entityDefinition("e1"))).toBe(false);
    expect(isLazyCacheOnRefreshEntity(entityDefinition("e1", true))).toBe(false);
    expect(isLazyCacheOnRefreshEntity(entityDefinition("e1", false))).toBe(true);
  });
});

describe("resolveEntitiesToFetchOnRefresh (1.2–1.3)", () => {
  const modelA = entity("model-a", "Entity");
  const modelB = entity("model-b", "EntityDefinition");
  const dataEager = entity("data-eager", "Book");
  const dataLazy = entity("data-lazy", "Blob");
  const dataDefault = entity("data-default", "Author");

  const definitionsByEntityUuid: Record<string, EntityDefinition> = {
    "data-eager": entityDefinition("data-eager", true),
    "data-lazy": entityDefinition("data-lazy", false),
    // data-default intentionally omitted → default eager
  };

  it("always includes every model entity regardless of cache flags", () => {
    const result = resolveEntitiesToFetchOnRefresh(
      [modelA, modelB],
      [dataLazy],
      {
        "data-lazy": entityDefinition("data-lazy", false),
        "model-a": entityDefinition("model-a", false),
        "model-b": entityDefinition("model-b", false),
      },
    );

    const modelUuids = result
      .filter((e) => e.section === "model")
      .map((e) => e.entity.uuid);
    expect(modelUuids).toEqual(["model-a", "model-b"]);
  });

  it("includes data entities whose cacheAllInstancesOnRefresh is true or absent", () => {
    const result = resolveEntitiesToFetchOnRefresh(
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
      [],
      [dataLazy],
      definitionsByEntityUuid,
    );

    expect(result).toEqual([]);
  });

  it("excludes Miroir Blob when EntityDefinition asset sets cacheAllInstancesOnRefresh false (Phase 4)", async () => {
    const { entityBlob, entityDefinitionBlob } = await import(
      "miroir-test-app_deployment-miroir"
    );
    expect(entityDefinitionBlob.cache?.cacheAllInstancesOnRefresh).toBe(false);

    const result = resolveEntitiesToFetchOnRefresh(
      [],
      [entityBlob as Entity],
      { [entityBlob.uuid]: entityDefinitionBlob as EntityDefinition },
    );

    expect(result).toEqual([]);
  });

  it("tags sections correctly on the fetch list", () => {
    const result = resolveEntitiesToFetchOnRefresh(
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
