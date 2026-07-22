import { describe, expect, it } from "vitest";

import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
  Entity,
  EntityDefinition,
  EntityInstance,
  InstanceCUDAction,
  JzodObject,
  ModelActionCreateEntity,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { produceEvolutionTraceEvent } from "../../src/2_domain/evolutionTraceWriter.js";
import { MIROIR_APPLICATION_UUID } from "../../src/2_domain/evolutionTracePolicy.js";

// ── Shared constants ────────────────────────────────────────────────────────
const LIBRARY_UUID = "dd986507-6b28-4aac-a27a-f2dfba2aa0e4";
const ENTITY_UUID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ENTITYDEF_UUID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ENTITY_PARENT_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITYDEF_PARENT_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e" as const;
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89" as const;
const TIMESTAMP = "2024-01-02T00:00:00.000Z";
const INSTANCE_UUID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function makeTraceRoot(applicationUuid: string): ApplicationEvolutionTrace {
  return {
    uuid: "11111111-1111-4111-8111-111111111111",
    parentUuid: ENTITY_PARENT_UUID,
    applicationUuid,
    branchName: "master",
    createdAt: "2024-01-01T00:00:00.000Z",
  };
}

/** Simulate the producer write path: collect events that would be persisted. */
function runProducer(
  action: ModelActionCreateEntity | InstanceCUDAction,
  applicationUuid: string,
): ApplicationEvolutionTraceEvent[] {
  const store: ApplicationEvolutionTraceEvent[] = [];
  const event = produceEvolutionTraceEvent(
    action,
    makeTraceRoot(applicationUuid),
    1,
    TIMESTAMP,
  );
  if (event !== undefined) {
    store.push(event);
  }
  return store;
}

const mockEntity: Entity = {
  uuid: ENTITY_UUID,
  parentUuid: ENTITY_PARENT_UUID,
  name: "TestEntity",
};

const mockEntityDefinition: EntityDefinition = {
  uuid: ENTITYDEF_UUID,
  parentUuid: ENTITYDEF_PARENT_UUID,
  name: "TestEntity",
  entityUuid: ENTITY_UUID,
  mlSchema: { type: "object", definition: {} } as JzodObject,
};

const mockInstance: EntityInstance = {
  uuid: INSTANCE_UUID,
  parentUuid: ENTITY_UUID,
};

describe("produceEvolutionTraceEvent — section/app tracking policy", () => {
  it("Library + data-section update → zero ApplicationEvolutionTraceEvent written", () => {
    const action: InstanceCUDAction = {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: LIBRARY_UUID,
        applicationSection: "data",
        objects: [mockInstance],
      },
    };

    const store = runProducer(action, LIBRARY_UUID);
    expect(store).toHaveLength(0);
  });

  it("Library + model-section update → one ApplicationEvolutionTraceEvent with applicationSection = model", () => {
    const action: ModelActionCreateEntity = {
      actionType: "createEntity",
      endpoint: MODEL_ENDPOINT,
      payload: {
        application: LIBRARY_UUID,
        entities: [{ entity: mockEntity, entityDefinition: mockEntityDefinition }],
      },
    };

    const store = runProducer(action, LIBRARY_UUID);
    expect(store).toHaveLength(1);
    expect(store[0].applicationSection).toBe("model");
    expect(store[0].operationType).toBe("createEntity");
  });

  it("Miroir + data-section update → one ApplicationEvolutionTraceEvent with applicationSection = data", () => {
    const action: InstanceCUDAction = {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: MIROIR_APPLICATION_UUID,
        applicationSection: "data",
        objects: [mockInstance],
      },
    };

    const store = runProducer(action, MIROIR_APPLICATION_UUID);
    expect(store).toHaveLength(1);
    expect(store[0].applicationSection).toBe("data");
    expect(store[0].operationType).toBe("createInstance");
  });
});
