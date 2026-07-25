import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

import {
  getEntityPrimaryKeyAttribute,
} from "../../src/1_core/EntityPrimaryKey.js";
import { shouldCacheAllInstancesOnRefresh } from "../../src/1_core/cacheRefreshPolicy.js";
import {
  ENTITY_PRESENT_MODEL_DEFINITION_FIELDS,
  UNVERSIONED_APPLICATION_FIXTURE,
  VERSIONED_APPLICATION_FIXTURE,
  compareEntityPresentModelDefinitions,
  inventoryEntityEntityDefinitionJoins,
  projectEntityPresentModelDefinition,
} from "../../src/1_core/entityPresentModel.js";
import type {
  Entity,
  EntityDefinition,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function entity(overrides: Partial<Entity> & Pick<Entity, "uuid" | "name">): Entity {
  return {
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    ...overrides,
  };
}

function entityDefinition(
  overrides: Partial<EntityDefinition> &
    Pick<EntityDefinition, "uuid" | "name" | "entityUuid" | "mlSchema">,
): EntityDefinition {
  return {
    parentUuid: "e432ecc7-9415-4fd8-b040-c6fbaea17e9a",
    parentName: "EntityDefinition",
    ...overrides,
  };
}

describe("inventoryEntityEntityDefinitionJoins", () => {
  it("classifies 1:1 matches, orphan entities, orphan definitions, and multiples", () => {
    const entities = [
      entity({ uuid: "e-matched", name: "Matched" }),
      entity({ uuid: "e-orphan", name: "OrphanEntity" }),
      entity({ uuid: "e-multi", name: "Multi" }),
    ];
    const entityDefinitions = [
      entityDefinition({
        uuid: "d-matched",
        name: "Matched",
        entityUuid: "e-matched",
        mlSchema: { type: "object", definition: {} },
      }),
      entityDefinition({
        uuid: "d-orphan",
        name: "OrphanDef",
        entityUuid: "e-missing",
        mlSchema: { type: "object", definition: {} },
      }),
      entityDefinition({
        uuid: "d-multi-a",
        name: "MultiA",
        entityUuid: "e-multi",
        mlSchema: { type: "object", definition: {} },
      }),
      entityDefinition({
        uuid: "d-multi-b",
        name: "MultiB",
        entityUuid: "e-multi",
        mlSchema: { type: "object", definition: {} },
      }),
    ];

    const inventory = inventoryEntityEntityDefinitionJoins(entities, entityDefinitions);

    expect(inventory.matched).toEqual([
      { entityUuid: "e-matched", entityDefinitionUuids: ["d-matched"] },
    ]);
    expect(inventory.orphanEntities).toEqual([{ uuid: "e-orphan", name: "OrphanEntity" }]);
    expect(inventory.orphanEntityDefinitions).toEqual([
      { uuid: "d-orphan", name: "OrphanDef", entityUuid: "e-missing" },
    ]);
    expect(inventory.multipleDefinitions).toEqual([
      {
        entityUuid: "e-multi",
        entityDefinitionUuids: ["d-multi-a", "d-multi-b"],
      },
    ]);
  });
});

describe("projectEntityPresentModelDefinition / compareEntityPresentModelDefinitions", () => {
  it("projects only the canonical definition-bearing fields", () => {
    expect(ENTITY_PRESENT_MODEL_DEFINITION_FIELDS).toEqual([
      "defaultInstanceDetailsReportUuid",
      "viewAttributes",
      "icon",
      "display",
      "cache",
      "idAttribute",
      "externalDataSource",
      "mlSchema",
    ]);

    const definition = entityDefinition({
      uuid: "d1",
      name: "Book",
      entityUuid: "e1",
      description: "ignored identity field",
      viewAttributes: ["title", "author"],
      idAttribute: "isbn",
      cache: { cacheAllInstancesOnRefresh: false },
      defaultInstanceDetailsReportUuid: "r1",
      mlSchema: { type: "object", definition: { title: { type: "string" } } },
    });

    expect(projectEntityPresentModelDefinition(definition)).toEqual({
      defaultInstanceDetailsReportUuid: "r1",
      viewAttributes: ["title", "author"],
      cache: { cacheAllInstancesOnRefresh: false },
      idAttribute: "isbn",
      mlSchema: { type: "object", definition: { title: { type: "string" } } },
    });
  });

  it("reports equal when both sides carry identical definition fields", () => {
    const left = {
      viewAttributes: ["a"],
      mlSchema: { type: "object" as const, definition: {} },
    };
    const right = {
      viewAttributes: ["a"],
      mlSchema: { type: "object" as const, definition: {} },
    };
    expect(compareEntityPresentModelDefinitions(left, right)).toEqual({
      equal: true,
      differingFields: [],
    });
  });

  it("reports differing fields when values diverge or only one side has them", () => {
    const left = {
      viewAttributes: ["a"],
      idAttribute: "code",
      mlSchema: { type: "object" as const, definition: { a: { type: "string" as const } } },
    };
    const right = {
      viewAttributes: ["b"],
      mlSchema: { type: "object" as const, definition: { a: { type: "string" as const } } },
      cache: { cacheAllInstancesOnRefresh: false },
    };

    const comparison = compareEntityPresentModelDefinitions(left, right);
    expect(comparison.equal).toBe(false);
    expect(comparison.differingFields.sort()).toEqual(
      ["cache", "idAttribute", "viewAttributes"].sort(),
    );
  });
});

describe("characterization — default MetaModels are clean 1:1 joins", () => {
  it("defaultMiroirMetaModel has one EntityDefinition per Entity and matching names", () => {
    const inventory = inventoryEntityEntityDefinitionJoins(
      defaultMiroirMetaModel.entities,
      defaultMiroirMetaModel.entityDefinitions,
    );
    expect(inventory.orphanEntities).toEqual([]);
    expect(inventory.orphanEntityDefinitions).toEqual([]);
    expect(inventory.multipleDefinitions).toEqual([]);
    expect(inventory.matched).toHaveLength(defaultMiroirMetaModel.entities.length);

    for (const match of inventory.matched) {
      const entity = defaultMiroirMetaModel.entities.find((e) => e.uuid === match.entityUuid)!;
      const entityDefinition = defaultMiroirMetaModel.entityDefinitions.find(
        (definition) => definition.uuid === match.entityDefinitionUuids[0],
      )!;
      expect(entityDefinition.entityUuid).toBe(entity.uuid);
      expect(entityDefinition.name).toBe(entity.name);
    }
  });

  it("defaultLibraryAppModel has one EntityDefinition per Entity and matching names", () => {
    const inventory = inventoryEntityEntityDefinitionJoins(
      defaultLibraryAppModel.entities,
      defaultLibraryAppModel.entityDefinitions,
    );
    expect(inventory.orphanEntities).toEqual([]);
    expect(inventory.orphanEntityDefinitions).toEqual([]);
    expect(inventory.multipleDefinitions).toEqual([]);
    expect(inventory.matched).toHaveLength(defaultLibraryAppModel.entities.length);
  });

  it("baseline: Entity instances do not yet carry definition-bearing fields", () => {
    for (const entity of defaultLibraryAppModel.entities) {
      const entityDefinition = defaultLibraryAppModel.entityDefinitions.find(
        (definition) => definition.entityUuid === entity.uuid,
      )!;
      const comparison = compareEntityPresentModelDefinitions(entity, entityDefinition);
      expect(comparison.equal).toBe(false);
      expect(comparison.differingFields).toContain("mlSchema");
    }
  });
});

describe("characterization — PK/cache still resolve from EntityDefinition", () => {
  it("locks current PK authority on EntityDefinition.idAttribute", () => {
    const withComposite = entityDefinition({
      uuid: "d-pk",
      name: "Pk",
      entityUuid: "e-pk",
      idAttribute: ["region", "code"],
      mlSchema: { type: "object", definition: {} },
    });
    expect(getEntityPrimaryKeyAttribute(withComposite)).toEqual(["region", "code"]);
    expect(
      getEntityPrimaryKeyAttribute(
        entityDefinition({
          uuid: "d-default",
          name: "Default",
          entityUuid: "e-default",
          mlSchema: { type: "object", definition: {} },
        }),
      ),
    ).toBe("uuid");
  });

  it("locks current cache-refresh authority on EntityDefinition.cache", () => {
    expect(
      shouldCacheAllInstancesOnRefresh(
        entityDefinition({
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
        entityDefinition({
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
  entityDefinitions: EntityDefinition[];
} {
  return {
    entities: loadJsonInstancesFromCollection(
      modelRootRelativePath,
      ENTITY_COLLECTION_UUID,
    ) as Entity[],
    entityDefinitions: loadJsonInstancesFromCollection(
      modelRootRelativePath,
      ENTITY_DEFINITION_COLLECTION_UUID,
    ) as EntityDefinition[],
  };
}

describe("characterization — filesystem deployment asset joins", () => {
  it("Miroir model assets are a clean 1:1 Entity ↔ EntityDefinition join", () => {
    const { entities, entityDefinitions } = loadDeploymentEntityJoinInputs(
      "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
    );
    const inventory = inventoryEntityEntityDefinitionJoins(entities, entityDefinitions);

    expect(entities).toHaveLength(20);
    expect(entityDefinitions).toHaveLength(20);
    expect(inventory.orphanEntities).toEqual([]);
    expect(inventory.orphanEntityDefinitions).toEqual([]);
    expect(inventory.multipleDefinitions).toEqual([]);
    expect(inventory.matched).toHaveLength(entities.length);
  });

  it("Library model assets are a clean 1:1 Entity ↔ EntityDefinition join", () => {
    const { entities, entityDefinitions } = loadDeploymentEntityJoinInputs(
      "packages/miroir-test-app_deployment-library/assets/library_model",
    );
    const inventory = inventoryEntityEntityDefinitionJoins(entities, entityDefinitions);

    expect(inventory.orphanEntities).toEqual([]);
    expect(inventory.orphanEntityDefinitions).toEqual([]);
    expect(inventory.multipleDefinitions).toEqual([]);
    expect(inventory.matched).toHaveLength(entities.length);
    expect(entities.length).toBe(entityDefinitions.length);
  });

  it("Admin model assets are a clean 1:1 Entity ↔ EntityDefinition join", () => {
    const { entities, entityDefinitions } = loadDeploymentEntityJoinInputs(
      "packages/miroir-test-app_deployment-admin/assets/admin_model",
    );
    const inventory = inventoryEntityEntityDefinitionJoins(entities, entityDefinitions);

    expect(inventory.orphanEntities).toEqual([]);
    expect(inventory.orphanEntityDefinitions).toEqual([]);
    expect(inventory.multipleDefinitions).toEqual([]);
    expect(inventory.matched).toHaveLength(entities.length);
    expect(entities.length).toBe(entityDefinitions.length);
  });
});
