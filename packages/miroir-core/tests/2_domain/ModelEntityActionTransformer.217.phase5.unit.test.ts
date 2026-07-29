import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  MetaModel,
  ModelAction,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ModelEntityActionTransformer } from "../../src/2_domain/ModelEntityActionTransformer.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityVersions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)!;

const currentModel = {
  ...defaultLibraryAppModel,
} as MetaModel;

describe("217 Phase 5 — ModelEntityActionTransformer dual-write", () => {
  // #220 — create is Entity-only (1 createInstance object); alter/rename dual-write still covered below when incomplete.
  it("createEntity emits Entity-only createInstance when Entity has complete present model", () => {
    const action: ModelAction = {
      actionType: "createEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: defaultLibraryAppModel.applicationUuid,
        entities: [bookEntity],
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
        expect(objects).toHaveLength(1);
        const entity = objects[0] as Entity;
        expect(entity.uuid).toBe(bookEntity.uuid);
        expect(entity.mlSchema).toEqual(bookEntity.mlSchema);
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

  it("dropEntity deletes only the live Entity and named EntityVersion UUIDs", () => {
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
