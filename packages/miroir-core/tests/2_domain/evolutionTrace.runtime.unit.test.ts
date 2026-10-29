import { describe, expect, it } from "vitest";

import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
  ModelActionCreateEntity,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  buildEvolutionTracePersistenceActions,
  collectEvolutionTraceStateFromDomainState,
} from "../../src/2_domain/evolutionTraceRuntime.js";
import {
  buildEvolutionBaselineCreateInstanceActions,
  EVOLUTION_TRACE_ENTITY_UUID,
  EVOLUTION_TRACE_EVENT_ENTITY_UUID,
} from "../../src/2_domain/evolutionTraceBaseline.js";
import { MIROIR_APPLICATION_UUID as MIROIR_UUID } from "../../src/2_domain/evolutionTracePolicy.js";

const REPORT_ENTITY_UUID = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
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
            uuid: ENTITY_UUID,
            parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
            name: "TestEntity",
            mlSchema: { type: "object", definition: {} } as any,
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

  it("Miroir data update → trace root/events in Miroir data, where Miroir keeps its instances (#222)", () => {
    const actions = buildEvolutionTracePersistenceActions(
      {
        actionType: "updateInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: MIROIR_UUID,
          applicationSection: "data",
          objects: [{ uuid: "0e4cf674-3a26-422a-8618-09e32302ac0c", parentUuid: REPORT_ENTITY_UUID }],
        },
      },
      { applicationUuid: MIROIR_UUID, roots: [], events: [] },
      undefined,
      TIMESTAMP,
    );

    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.every((a) => a.payload.applicationSection === "data")).toBe(true);
  });
});

describe("buildEvolutionBaselineCreateInstanceActions", () => {
  it("persists the baseline in Library model and in Miroir data", () => {
    const sections = (applicationUuid: string) =>
      buildEvolutionBaselineCreateInstanceActions(applicationUuid, TIMESTAMP).map(
        (a) => a.payload.applicationSection,
      );
    expect(sections(LIBRARY_UUID)).toEqual(["model", "model"]);
    expect(sections(MIROIR_UUID)).toEqual(["data", "data"]);
  });
});

describe("collectEvolutionTraceStateFromDomainState", () => {
  const root = { uuid: "r1", parentUuid: EVOLUTION_TRACE_ENTITY_UUID, branchName: "master" };
  const event = { uuid: "e1", parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID, traceRootUuid: "r1" };
  const sectionWithTraces = (applicationUuid: string) => ({
    [EVOLUTION_TRACE_ENTITY_UUID]: { r1: { ...root, applicationUuid } },
    [EVOLUTION_TRACE_EVENT_ENTITY_UUID]: { e1: event },
  });

  it("reads Library traces from Library model", () => {
    const state = collectEvolutionTraceStateFromDomainState(
      { libraryDeployment: { model: sectionWithTraces(LIBRARY_UUID) } } as any,
      "libraryDeployment",
      LIBRARY_UUID,
    );
    expect(state.roots.map((r) => r.uuid)).toEqual(["r1"]);
    expect(state.events.map((e) => e.uuid)).toEqual(["e1"]);
  });

  it("reads Miroir traces from Miroir data", () => {
    const state = collectEvolutionTraceStateFromDomainState(
      { miroirDeployment: { model: {}, data: sectionWithTraces(MIROIR_UUID) } } as any,
      "miroirDeployment",
      MIROIR_UUID,
    );
    expect(state.roots.map((r) => r.uuid)).toEqual(["r1"]);
    expect(state.events.map((e) => e.uuid)).toEqual(["e1"]);
  });
});
