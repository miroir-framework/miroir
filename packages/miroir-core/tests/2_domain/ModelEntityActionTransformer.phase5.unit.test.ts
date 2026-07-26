import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityDefinition,
  MetaModel,
  ModelAction,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ModelEntityActionTransformer } from "../../src/2_domain/ModelEntityActionTransformer.js";
import { compareEntityPresentModelDefinitions } from "../../src/1_core/entityPresentModel.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityDefinitions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)!;

const currentModel = {
  ...defaultLibraryAppModel,
} as MetaModel;

describe("217 Phase 5 — ModelEntityActionTransformer dual-write", () => {
  it("createEntity normalizes pairs and emits Entity + EntityDefinition instances", () => {
    const action: ModelAction = {
      actionType: "createEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: defaultLibraryAppModel.applicationUuid,
        entities: [
          {
            entity: {
              uuid: bookEntity.uuid,
              name: bookEntity.name,
              parentUuid: bookEntity.parentUuid,
            } as Entity,
            entityVersion: bookDefinition,
          },
        ],
      },
    };
    const instanceActions = ModelEntityActionTransformer.modelActionToInstanceAction(
      "00000000-0000-4000-8000-000000000001",
      action,
      currentModel,
    );
    expect(Array.isArray(instanceActions)).toBe(true);
    if (Array.isArray(instanceActions)) {
      expect(instanceActions).toHaveLength(1);
      expect(instanceActions[0].actionType).toBe("createInstance");
      if (instanceActions[0].actionType === "createInstance") {
        const objects = instanceActions[0].payload.objects;
        expect(objects).toHaveLength(2);
        const entity = objects[0] as Entity;
        const entityDefinition = objects[1] as EntityDefinition;
        expect(entity.mlSchema).toEqual(bookDefinition.mlSchema);
        expect(
          compareEntityPresentModelDefinitions(entity, entityDefinition).equal,
        ).toBe(true);
      }
    }
  });

  it("alterEntityAttribute updates Entity only when present model is complete", () => {
    const action: ModelAction = {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: defaultLibraryAppModel.applicationUuid,
        entityName: bookEntity.name,
        entityUuid: bookEntity.uuid,
        entityVersionUuid: bookDefinition.uuid,
        addColumns: [{ name: "isbn", definition: { type: "string" } }],
      },
    };
    const instanceActions = ModelEntityActionTransformer.modelActionToInstanceAction(
      "00000000-0000-4000-8000-000000000001",
      action,
      currentModel,
    );
    expect(Array.isArray(instanceActions)).toBe(true);
    if (Array.isArray(instanceActions) && instanceActions[0].actionType === "updateInstance") {
      const objects = instanceActions[0].payload.objects;
      expect(objects).toHaveLength(1);
      const entity = objects[0] as Entity;
      expect(entity.mlSchema?.definition).toHaveProperty("isbn");
    }
  });

  it("renameEntity renames Entity only when present model is complete", () => {
    const action: ModelAction = {
      actionType: "renameEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: defaultLibraryAppModel.applicationUuid,
        entityUuid: bookEntity.uuid,
        entityVersionUuid: bookDefinition.uuid,
        targetValue: "Volume",
      },
    };
    const instanceActions = ModelEntityActionTransformer.modelActionToInstanceAction(
      "00000000-0000-4000-8000-000000000001",
      action,
      currentModel,
    );
    expect(Array.isArray(instanceActions)).toBe(true);
    if (Array.isArray(instanceActions) && instanceActions[0].actionType === "updateInstance") {
      const objects = instanceActions[0].payload.objects as Array<{ name: string }>;
      expect(objects.map((object) => object.name)).toEqual(["Volume"]);
    }
  });

  it("dropEntity deletes only the live Entity and named EntityDefinition UUIDs", () => {
    const action: ModelAction = {
      actionType: "dropEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: defaultLibraryAppModel.applicationUuid,
        entityUuid: bookEntity.uuid,
        entityVersionUuid: bookDefinition.uuid,
      },
    };
    const instanceActions = ModelEntityActionTransformer.modelActionToInstanceAction(
      "00000000-0000-4000-8000-000000000001",
      action,
      currentModel,
    );
    expect(Array.isArray(instanceActions)).toBe(true);
    if (Array.isArray(instanceActions) && instanceActions[0].actionType === "deleteInstance") {
      expect(instanceActions[0].payload.objects).toEqual([
        { parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad", uuid: bookEntity.uuid },
        { parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd", uuid: bookDefinition.uuid },
      ]);
    }
  });
});
