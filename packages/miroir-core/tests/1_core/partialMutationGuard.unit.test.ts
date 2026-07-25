import { describe, expect, it } from "vitest";

import {
  MIROIR_CACHE_SEGMENT_MARKER,
  PARTIAL_MUTATION_REJECTED_MESSAGE,
  isPartialMutationInstanceAction,
  markSiblingPartialSegmentStale,
  rejectPartialMutationInstanceAction,
} from "../../src/1_core/partialMutationGuard.js";
import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement.js";
import { getReduxDeploymentsStateIndex } from "../../src/2_domain/ReduxDeploymentsState.js";
import type { InstanceAction } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEPLOY = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ENT = "33333333-3333-3333-3333-333333333333";
const INST = "44444444-4444-4444-4444-444444444444";

function createAction(
  objects: Record<string, unknown>[],
  extraPayload: Record<string, unknown> = {}
): InstanceAction {
  return {
    actionType: "createInstance",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: APP,
      applicationSection: "data",
      objects: objects as any,
      ...extraPayload,
    },
  };
}

describe("partialMutationGuard (4.1)", () => {
  it("detects partial marker on instance", () => {
    expect(
      isPartialMutationInstanceAction(
        createAction([
          { uuid: INST, parentUuid: ENT, [MIROIR_CACHE_SEGMENT_MARKER]: "partial" },
        ])
      )
    ).toBe(true);
  });

  it("detects partial marker on payload.cacheSegment", () => {
    expect(
      isPartialMutationInstanceAction(
        createAction([{ uuid: INST, parentUuid: ENT }], { cacheSegment: "partial" })
      )
    ).toBe(true);
  });

  it("allows unmarked create/update and delete", () => {
    expect(
      isPartialMutationInstanceAction(
        createAction([{ uuid: INST, parentUuid: ENT, name: "full" }])
      )
    ).toBe(false);
    expect(
      isPartialMutationInstanceAction({
        actionType: "deleteInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: APP,
          applicationSection: "data",
          objects: [{ uuid: INST, parentUuid: ENT }] as any,
        },
      })
    ).toBe(false);
  });

  it("rejectPartialMutationInstanceAction returns Action2Error for partial create", () => {
    const err = rejectPartialMutationInstanceAction(
      createAction([
        { uuid: INST, parentUuid: ENT, [MIROIR_CACHE_SEGMENT_MARKER]: "partial" },
      ])
    );
    expect(err).toBeInstanceOf(Action2Error);
    expect(err?.errorMessage).toBe(PARTIAL_MUTATION_REJECTED_MESSAGE);
  });

  it("rejectPartialMutationInstanceAction returns undefined for full create", () => {
    expect(
      rejectPartialMutationInstanceAction(
        createAction([{ uuid: INST, parentUuid: ENT, name: "ok" }])
      )
    ).toBeUndefined();
  });
});

describe("markSiblingPartialSegmentStale (4.2)", () => {
  it("sets partial segment freshness to stale without deleting instances", () => {
    const partialIndex = getReduxDeploymentsStateIndex(DEPLOY, "data", ENT, "partial");
    const state = {
      current: {
        [partialIndex]: {
          ids: [INST],
          entities: { [INST]: { uuid: INST, name: "keep" } },
          segment: {
            kind: "partial" as const,
            freshness: "fresh" as const,
            projection: ["name", "uuid"],
          },
        },
      },
    };
    markSiblingPartialSegmentStale(state, DEPLOY, "data", ENT);
    expect(state.current[partialIndex].segment).toEqual({
      kind: "partial",
      freshness: "stale",
      projection: ["name", "uuid"],
    });
    expect(state.current[partialIndex].entities[INST]).toEqual({
      uuid: INST,
      name: "keep",
    });
  });

  it("no-ops when partial segment is absent", () => {
    const state = { current: {} };
    markSiblingPartialSegmentStale(state, DEPLOY, "data", ENT);
    expect(state.current).toEqual({});
  });
});
