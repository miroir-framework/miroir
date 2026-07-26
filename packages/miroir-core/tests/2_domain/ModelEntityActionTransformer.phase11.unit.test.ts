import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  MetaModel,
  ModelAction,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ModelEntityActionTransformer } from "../../src/2_domain/ModelEntityActionTransformer.js";
import {
  planAlterEntityAttributeMutation,
  resolveLiveEntityDefinitionForAction,
} from "../../src/1_core/modelEntityActionLiveResolve.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityDefinitions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)!;

describe("217 Phase 11 — Model Actions Entity-first", () => {
  it("resolves live EntityDefinition by entityUuid when entityDefinitionUuid omitted", () => {
    const resolved = resolveLiveEntityDefinitionForAction(
      defaultLibraryAppModel as MetaModel,
      bookEntity.uuid,
    );
    expect(resolved?.uuid).toBe(bookDefinition.uuid);
  });

  it("alterEntityAttribute without entityDefinitionUuid dual-writes when live ED exists", () => {
    const action: ModelAction = {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: defaultLibraryAppModel.applicationUuid,
        entityName: bookEntity.name,
        entityUuid: bookEntity.uuid,
        entityDefinitionUuid: bookDefinition.uuid,
        addColumns: [{ name: "isbn11", definition: { type: "string" } }],
      },
    };
    // Omit entityDefinitionUuid at runtime (cast) to prove Action no longer requires it.
    delete (action.payload as { entityDefinitionUuid?: string }).entityDefinitionUuid;

    const instanceActions = ModelEntityActionTransformer.modelActionToInstanceAction(
      "00000000-0000-4000-8000-000000000001",
      action,
      defaultLibraryAppModel as MetaModel,
    );
    expect(Array.isArray(instanceActions)).toBe(true);
    if (Array.isArray(instanceActions) && instanceActions[0]?.actionType === "updateInstance") {
      expect(instanceActions[0].payload.objects).toHaveLength(2);
      const entity = instanceActions[0].payload.objects[0] as Entity;
      expect(entity.mlSchema?.definition).toHaveProperty("isbn11");
    }
  });

  it("plans Entity-only alter when no live EntityDefinition exists", () => {
    const entityOnlyModel = {
      ...defaultLibraryAppModel,
      entities: [bookEntity],
      entityDefinitions: [],
    } as MetaModel;
    const plan = planAlterEntityAttributeMutation(entityOnlyModel, bookEntity.uuid, {
      addColumns: [{ name: "isbnOnly", definition: { type: "string" } }],
    });
    expect(plan?.mode).toBe("entityOnly");
    if (plan?.mode === "entityOnly") {
      expect(plan.entity.mlSchema?.definition).toHaveProperty("isbnOnly");
    }
  });

  it("dropEntity requires only entityUuid and deletes live ED when present", () => {
    const action: ModelAction = {
      actionType: "dropEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: defaultLibraryAppModel.applicationUuid,
        entityUuid: bookEntity.uuid,
        entityDefinitionUuid: bookDefinition.uuid,
      },
    };
    delete (action.payload as { entityDefinitionUuid?: string }).entityDefinitionUuid;

    const instanceActions = ModelEntityActionTransformer.modelActionToInstanceAction(
      "00000000-0000-4000-8000-000000000001",
      action,
      defaultLibraryAppModel as MetaModel,
    );
    expect(Array.isArray(instanceActions)).toBe(true);
    if (Array.isArray(instanceActions) && instanceActions[0]?.actionType === "deleteInstance") {
      expect(instanceActions[0].payload.objects).toHaveLength(2);
      expect(instanceActions[0].payload.objects[0].uuid).toBe(bookEntity.uuid);
      expect(instanceActions[0].payload.objects[1].uuid).toBe(bookDefinition.uuid);
    }
  });
});
