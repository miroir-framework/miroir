import { describe, expect, it } from "vitest";
import {
  getReduxDeploymentsStateIndex,
  type ApplicationDeploymentMap,
  type EntityInstance,
  type EntityInstanceCollection,
  type InstanceAction,
} from "miroir-core";

import {
  LocalCache,
  localCacheStateToDomainState,
  setLocalCacheSegmentFreshness,
} from "../src/index.js";

const testApplicationUuid = "11111111-1111-1111-1111-111111111111";
const testDeploymentUuid = "22222222-2222-2222-2222-222222222222";
const testEntityUuid = "33333333-3333-3333-3333-333333333333";
const testInstanceUuid = "44444444-4444-4444-4444-444444444444";

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [testApplicationUuid]: testDeploymentUuid,
};

const fullIndex = getReduxDeploymentsStateIndex(
  testDeploymentUuid,
  "data",
  testEntityUuid,
  "full"
);
const partialIndex = getReduxDeploymentsStateIndex(
  testDeploymentUuid,
  "data",
  testEntityUuid,
  "partial"
);

function loadCollection(
  localCache: LocalCache,
  collection: EntityInstanceCollection
): void {
  const loadAction: InstanceAction = {
    actionType: "loadNewInstancesInLocalCache",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: testApplicationUuid,
      objects: [collection],
    },
  };
  localCache.handleLocalCacheAction(loadAction, applicationDeploymentMap);
}

describe("LocalCache segments (#214 Phase 2) — Redux", () => {
  it("2.1 projected load writes/replaces partial segment only", () => {
    const localCache = new LocalCache();
    const projected: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      name: "label-only",
    } as EntityInstance;

    loadCollection(localCache, {
      parentUuid: testEntityUuid,
      applicationSection: "data",
      attributes: ["name", "uuid"],
      instances: [projected],
    });

    const snap = localCache.getState().presentModelSnapshot;
    expect(snap.current[partialIndex]?.segment).toEqual({
      kind: "partial",
      freshness: "fresh",
      projection: ["name", "uuid"],
    });
    expect(snap.current[partialIndex]?.entities?.[testInstanceUuid]).toMatchObject({
      uuid: testInstanceUuid,
      name: "label-only",
    });
    expect(snap.current[fullIndex]).toBeUndefined();

    // Replace partial with a different projection
    loadCollection(localCache, {
      parentUuid: testEntityUuid,
      applicationSection: "data",
      attributes: ["uuid"],
      instances: [{ uuid: testInstanceUuid, parentUuid: testEntityUuid } as EntityInstance],
    });
    const snap2 = localCache.getState().presentModelSnapshot;
    expect(snap2.current[partialIndex]?.segment?.projection).toEqual(["uuid"]);
    expect(snap2.current[partialIndex]?.entities?.[testInstanceUuid]).not.toHaveProperty(
      "name"
    );
    expect(snap2.current[fullIndex]).toBeUndefined();
  });

  it("2.2 non-projected load writes full segment only", () => {
    const localCache = new LocalCache();
    const full: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      name: "full-row",
      extra: "kept",
    } as EntityInstance;

    loadCollection(localCache, {
      parentUuid: testEntityUuid,
      applicationSection: "data",
      instances: [full],
    });

    const snap = localCache.getState().presentModelSnapshot;
    expect(snap.current[fullIndex]?.segment).toEqual({
      kind: "full",
      freshness: "fresh",
    });
    expect(snap.current[fullIndex]?.entities?.[testInstanceUuid]).toMatchObject({
      name: "full-row",
      extra: "kept",
    });
    expect(snap.current[partialIndex]).toBeUndefined();
  });

  it("2.3 full and partial segments are isolated (same uuid, different attrs)", () => {
    const localCache = new LocalCache();

    loadCollection(localCache, {
      parentUuid: testEntityUuid,
      applicationSection: "data",
      instances: [
        {
          uuid: testInstanceUuid,
          parentUuid: testEntityUuid,
          name: "full-name",
          body: "big",
        } as EntityInstance,
      ],
    });
    loadCollection(localCache, {
      parentUuid: testEntityUuid,
      applicationSection: "data",
      attributes: ["name", "uuid"],
      instances: [
        {
          uuid: testInstanceUuid,
          parentUuid: testEntityUuid,
          name: "partial-name",
        } as EntityInstance,
      ],
    });

    const snap = localCache.getState().presentModelSnapshot;
    const fullRow = snap.current[fullIndex]?.entities?.[testInstanceUuid] as any;
    const partialRow = snap.current[partialIndex]?.entities?.[testInstanceUuid] as any;

    expect(fullRow.body).toBe("big");
    expect(fullRow.name).toBe("full-name");
    expect(partialRow.name).toBe("partial-name");
    expect(partialRow).not.toHaveProperty("body");

    // Domain state exposes full segment only
    const domain = localCacheStateToDomainState(snap);
    expect(domain[testDeploymentUuid].data[testEntityUuid][testInstanceUuid]).toMatchObject({
      name: "full-name",
      body: "big",
    });
  });

  it("2.4 setLocalCacheSegmentFreshness marks stale without deleting instances", () => {
    const localCache = new LocalCache();
    loadCollection(localCache, {
      parentUuid: testEntityUuid,
      applicationSection: "data",
      attributes: ["name", "uuid"],
      instances: [
        {
          uuid: testInstanceUuid,
          parentUuid: testEntityUuid,
          name: "keep-me",
        } as EntityInstance,
      ],
    });

    const state = structuredClone(localCache.getState().presentModelSnapshot);
    setLocalCacheSegmentFreshness(
      state,
      testDeploymentUuid,
      "data",
      testEntityUuid,
      "partial",
      "stale"
    );

    expect(state.current[partialIndex].segment).toEqual({
      kind: "partial",
      freshness: "stale",
      projection: ["name", "uuid"],
    });
    expect(state.current[partialIndex].entities[testInstanceUuid]).toMatchObject({
      name: "keep-me",
    });
  });
});
