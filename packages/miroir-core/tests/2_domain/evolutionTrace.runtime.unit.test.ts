import { describe, expect, it } from "vitest";

import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
  ModelActionCreateEntity,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  buildEvolutionTracePersistenceActions,
} from "../../src/2_domain/evolutionTraceRuntime.js";
import {
  EVOLUTION_TRACE_ENTITY_UUID,
  EVOLUTION_TRACE_EVENT_ENTITY_UUID,
} from "../../src/2_domain/evolutionTraceBaseline.js";

const LIBRARY_UUID = "dd986507-6b28-4aac-a27a-f2dfba2aa0e4";
const ENTITY_UUID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ENTITYDEF_UUID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const TIMESTAMP = new Date("2024-01-02T00:00:00.000Z");

describe("buildEvolutionTracePersistenceActions", () => {
  it("Library model createEntity → baseline root/event + raw createEntity event in Library model", () => {
    const action: ModelActionCreateEntity = {
      actionType: "createEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: LIBRARY_UUID,
        entities: [
          {
            entity: {
              uuid: ENTITY_UUID,
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "TestEntity",
            },
            entityDefinition: {
              uuid: ENTITYDEF_UUID,
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              name: "TestEntity",
              entityUuid: ENTITY_UUID,
              mlSchema: { type: "object", definition: {} } as any,
            },
          },
        ],
      },
    };

    const actions = buildEvolutionTracePersistenceActions(
      action,
      { applicationUuid: LIBRARY_UUID, roots: [], events: [] },
      undefined,
      TIMESTAMP,
    );

    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.every((a) => a.payload.application === LIBRARY_UUID)).toBe(true);
    expect(actions.every((a) => a.payload.applicationSection === "model")).toBe(true);

    const rootAction = actions.find((a) => a.payload.parentUuid === EVOLUTION_TRACE_ENTITY_UUID);
    const eventActions = actions.filter(
      (a) => a.payload.parentUuid === EVOLUTION_TRACE_EVENT_ENTITY_UUID,
    );
    expect(rootAction).toBeDefined();
    expect(eventActions.length).toBeGreaterThanOrEqual(2);

    const root = rootAction!.payload.objects[0] as ApplicationEvolutionTrace;
    expect(root.applicationUuid).toBe(LIBRARY_UUID);
    expect(root.branchName).toBe("master");

    const rawEvent = eventActions
      .flatMap((a) => a.payload.objects as ApplicationEvolutionTraceEvent[])
      .find((e) => e.operationType === "createEntity");
    expect(rawEvent).toBeDefined();
    expect(rawEvent!.applicationSection).toBe("model");
    expect(rawEvent!.targetEntityUuid).toBe(ENTITY_UUID);
  });

  it("does not recurse when persisting evolution-trace entities themselves", () => {
    const actions = buildEvolutionTracePersistenceActions(
      {
        actionType: "createInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: LIBRARY_UUID,
          applicationSection: "model",
          objects: [
            {
              uuid: "11111111-1111-4111-8111-111111111111",
              parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID,
            },
          ],
        },
      },
      { applicationUuid: LIBRARY_UUID, roots: [], events: [] },
      undefined,
      TIMESTAMP,
    );
    expect(actions).toHaveLength(0);
  });
});
