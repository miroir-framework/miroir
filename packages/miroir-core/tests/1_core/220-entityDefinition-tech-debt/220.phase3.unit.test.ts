/**
 * #220 Phase 3 — present-model Actions stay Entity-only for complete Entities
 * even when MetaModel.entityDefinitions is empty.
 */
import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  MetaModel,
  ModelAction,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ModelEntityActionTransformer } from "../../../src/2_domain/ModelEntityActionTransformer.js";
import {
  planAlterEntityAttributeMutation,
  planRenameEntityMutation,
} from "../../../src/1_core/modelEntityActionLiveResolve.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;

function modelWithoutEntityDefinitions(): MetaModel {
  return {
    ...(defaultLibraryAppModel as MetaModel),
    entityDefinitions: [],
  };
}

describe("220 Phase 3 — Entity-only Actions without live EntityDefinitions", () => {
  it("plans Entity-only rename when Entity is complete and entityDefinitions is empty", () => {
    const plan = planRenameEntityMutation(
      modelWithoutEntityDefinitions(),
      bookEntity.uuid,
      "BookRenamed",
    );
    expect(plan?.mode).toBe("entityOnly");
    if (plan?.mode === "entityOnly") {
      expect(plan.entity.name).toBe("BookRenamed");
    }
  });

  it("plans Entity-only alter when Entity is complete and entityDefinitions is empty", () => {
    const plan = planAlterEntityAttributeMutation(
      modelWithoutEntityDefinitions(),
      bookEntity.uuid,
      { addColumns: [{ name: "isbn220", definition: { type: "string" } }] },
    );
    expect(plan?.mode).toBe("entityOnly");
    if (plan?.mode === "entityOnly") {
      expect(plan.entity.mlSchema?.definition).toHaveProperty("isbn220");
    }
  });

  it("renameEntity transformer emits Entity-only updateInstance without ED rows", () => {
    const action: ModelAction = {
      actionType: "renameEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: defaultLibraryAppModel.applicationUuid,
        entityName: bookEntity.name,
        entityUuid: bookEntity.uuid,
        targetValue: "BookOnly",
      },
    };
    const instanceActions = ModelEntityActionTransformer.modelActionToInstanceAction(
      "00000000-0000-4000-8000-000000000001",
      action,
      modelWithoutEntityDefinitions(),
    );
    expect(Array.isArray(instanceActions)).toBe(true);
    if (Array.isArray(instanceActions) && instanceActions[0]?.actionType === "updateInstance") {
      expect(instanceActions[0].payload.objects).toHaveLength(1);
      expect((instanceActions[0].payload.objects[0] as Entity).name).toBe("BookOnly");
      expect((instanceActions[0].payload.objects[0] as Entity).uuid).toBe(bookEntity.uuid);
    }
  });
});
