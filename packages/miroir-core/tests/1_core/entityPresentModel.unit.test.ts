import { describe, expect, it } from "vitest";


import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { entityEntity } from "miroir-test-app_deployment-miroir";

import {
  entityMLSchema,
  entityWithResolvedMLSchema,
} from "../../src/0_interfaces/1_core/EntityVersion.js";
import type {
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  getEntityPrimaryKeyAttribute,
} from "../../src/1_core/Entity/EntityPrimaryKey.js";
import { shouldCacheAllInstancesOnRefresh } from "../../src/1_core/localCache/cacheRefreshPolicy.js";
import {
  UNVERSIONED_APPLICATION_FIXTURE,
  VERSIONED_APPLICATION_FIXTURE
} from "../../src/1_core/versioning/applicationVersioning.js";

function entityVersion(
  overrides: Partial<EntityVersion> &
    Pick<EntityVersion, "uuid" | "name" | "entityUuid" | "mlSchema">,
): EntityVersion {
  return {
    parentUuid: "e432ecc7-9415-4fd8-b040-c6fbaea17e9a",
    parentName: "EntityVersion",
    ...overrides,
  };
}

describe("characterization — PK/cache still resolve from EntityVersion", () => {
  it("locks current PK authority on EntityVersion.idAttribute", () => {
    const withComposite = entityVersion({
      uuid: "d-pk",
      name: "Pk",
      entityUuid: "e-pk",
      idAttribute: ["region", "code"],
      mlSchema: { type: "object", definition: {} },
    });
    expect(getEntityPrimaryKeyAttribute(withComposite)).toEqual(["region", "code"]);
    expect(
      getEntityPrimaryKeyAttribute(
        entityVersion({
          uuid: "d-default",
          name: "Default",
          entityUuid: "e-default",
          mlSchema: { type: "object", definition: {} },
        }),
      ),
    ).toBe("uuid");
  });

  it("locks current cache-refresh authority on EntityVersion.cache", () => {
    expect(
      shouldCacheAllInstancesOnRefresh(
        entityVersion({
          uuid: "d-lazy",
          name: "Lazy",
          entityUuid: "e-lazy",
          cache: { cacheAllInstancesOnRefresh: false },
          mlSchema: { type: "object", definition: {} },
        }),
      ),
    ).toBe(false);
    expect(
      shouldCacheAllInstancesOnRefresh(
        entityVersion({
          uuid: "d-eager",
          name: "Eager",
          entityUuid: "e-eager",
          mlSchema: { type: "object", definition: {} },
        }),
      ),
    ).toBe(true);
  });
});

describe("versioning capability fixtures", () => {
  it("exposes immutable versioned and unversioned application fixtures", () => {
    expect(VERSIONED_APPLICATION_FIXTURE).toEqual({ versioningEnabled: true });
    expect(UNVERSIONED_APPLICATION_FIXTURE).toEqual({ versioningEnabled: false });
  });
});

const ENTITY_COLLECTION_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITY_DEFINITION_COLLECTION_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../");

function loadJsonInstancesFromCollection(
  modelRootRelativePath: string,
  collectionUuid: string,
): Array<Record<string, unknown>> {
  const collectionDir = join(repoRoot, modelRootRelativePath, collectionUuid);
  return readdirSync(collectionDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) =>
      JSON.parse(readFileSync(join(collectionDir, name), "utf8")) as Record<string, unknown>,
    );
}

function loadDeploymentEntityJoinInputs(modelRootRelativePath: string): {
  entities: Entity[];
  entityDefinitions: EntityVersion[];
} {
  return {
    entities: loadJsonInstancesFromCollection(
      modelRootRelativePath,
      ENTITY_COLLECTION_UUID,
    ) as Entity[],
    entityDefinitions: loadJsonInstancesFromCollection(
      modelRootRelativePath,
      ENTITY_DEFINITION_COLLECTION_UUID,
    ) as EntityVersion[],
  };
}

describe("Entity mlSchema resolution", () => {
  it("resolves Entity.mlSchema extending entityDefinitionRoot", () => {
    const entity = entityEntity as Entity;
    const resolved = entityMLSchema(entity);
    expect(resolved.type).toBe("object");
    expect(resolved.definition).toHaveProperty("name");
    expect(resolved.definition).toHaveProperty("mlSchema");
    // root identity fields come from entityDefinitionRoot extend
    expect(resolved.definition).toHaveProperty("uuid");
    expect(resolved.definition).toHaveProperty("parentUuid");
  });

  it("returns Entity with inlined resolved mlSchema", () => {
    const entity = entityEntity as Entity;
    const withResolved = entityWithResolvedMLSchema(entity);
    expect(withResolved.uuid).toBe(entity.uuid);
    expect(withResolved.mlSchema?.extend).toBeUndefined();
    expect(withResolved.mlSchema?.definition).toHaveProperty("uuid");
    expect(withResolved.mlSchema?.definition).toHaveProperty("mlSchema");
  });

  it("throws when Entity has no mlSchema", () => {
    const incomplete: Entity = {
      uuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "Incomplete",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    };
    expect(() => entityMLSchema(incomplete)).toThrow(/mlSchema/);
  });
});
