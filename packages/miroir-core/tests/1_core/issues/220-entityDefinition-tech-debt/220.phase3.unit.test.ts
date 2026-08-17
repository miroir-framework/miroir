/**
 * #220 Phase 3 — present-model Actions stay Entity-only for complete Entities
 * even when MetaModel.entityVersions is empty.
 */
import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  MetaModel,
  ModelAction,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ModelEntityActionTransformer } from "../../../../src/2_domain/ModelEntityActionTransformer.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity: Entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;

function modelWithoutEntityDefinitions(): MetaModel {
  return {
    ...(defaultLibraryAppModel as MetaModel),
    entityVersions: [],
  };
}

describe("220 Phase 3 — Entity-only Actions without live EntityDefinitions", () => {
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
