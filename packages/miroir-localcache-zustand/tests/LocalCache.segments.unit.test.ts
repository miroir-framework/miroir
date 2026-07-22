import { describe, expect, it } from "vitest";
import {
  Action2Error,
  getReduxDeploymentsStateIndex,
  MIROIR_CACHE_SEGMENT_MARKER,
  PARTIAL_MUTATION_REJECTED_MESSAGE,
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

describe("LocalCache segments (#214 Phase 2) — Zustand", () => {
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

  function seedFullAndPartial(localCache: LocalCache): void {
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
  }

  it("4.1 createInstance with partial marker returns Action2Error before mutating", () => {
    const localCache = new LocalCache();
    seedFullAndPartial(localCache);
    const before = localCache.getState().presentModelSnapshot.current[partialIndex]?.segment;

    const result = localCache.handleLocalCacheAction(
      {
        actionType: "createInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: testApplicationUuid,
          applicationSection: "data",
          objects: [
            {
              uuid: "66666666-6666-6666-6666-666666666666",
              parentUuid: testEntityUuid,
              name: "nope",
              [MIROIR_CACHE_SEGMENT_MARKER]: "partial",
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap
    );

    expect(result).toMatchObject({
      status: "error",
      errorMessage: PARTIAL_MUTATION_REJECTED_MESSAGE,
    });
    expect(
      localCache.getState().presentModelSnapshot.current[partialIndex]?.segment
    ).toEqual(before);
  });

  it("4.1 updateInstance with partial marker returns Action2Error", () => {
    const localCache = new LocalCache();
    seedFullAndPartial(localCache);

    const result = localCache.handleLocalCacheAction(
      {
        actionType: "updateInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: testApplicationUuid,
          applicationSection: "data",
          objects: [
            {
              uuid: testInstanceUuid,
              parentUuid: testEntityUuid,
              name: "patched",
              [MIROIR_CACHE_SEGMENT_MARKER]: "partial",
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap
    );

    expect(result).toMatchObject({
      status: "error",
      errorMessage: PARTIAL_MUTATION_REJECTED_MESSAGE,
    });
    expect(
      (localCache.getState().presentModelSnapshot.current[fullIndex]?.entities as any)?.[
        testInstanceUuid
      ]?.name
    ).toBe("full-name");
  });

  it("4.2 after createInstance on full segment, sibling partial is stale", () => {
    const localCache = new LocalCache();
    seedFullAndPartial(localCache);

    const result = localCache.handleLocalCacheAction(
      {
        actionType: "createInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: testApplicationUuid,
          applicationSection: "data",
          objects: [
            {
              uuid: "77777777-7777-7777-7777-777777777777",
              parentUuid: testEntityUuid,
              name: "new-full",
              body: "x",
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap
    );

    expect(result).toMatchObject({ status: "ok" });
    const snap = localCache.getState().presentModelSnapshot;
    expect(snap.current[partialIndex]?.segment?.freshness).toBe("stale");
    expect(snap.current[partialIndex]?.entities?.[testInstanceUuid]).toMatchObject({
      name: "partial-name",
    });
  });

  it("4.2 after updateInstance on full segment, sibling partial is stale", () => {
    const localCache = new LocalCache();
    seedFullAndPartial(localCache);

    localCache.handleLocalCacheAction(
      {
        actionType: "updateInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: testApplicationUuid,
          applicationSection: "data",
          objects: [
            {
              uuid: testInstanceUuid,
              parentUuid: testEntityUuid,
              name: "updated-full",
              body: "bigger",
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap
    );

    expect(
      localCache.getState().presentModelSnapshot.current[partialIndex]?.segment?.freshness
    ).toBe("stale");
  });

  it("4.2 after deleteInstance on full segment, sibling partial is stale", () => {
    const localCache = new LocalCache();
    seedFullAndPartial(localCache);

    localCache.handleLocalCacheAction(
      {
        actionType: "deleteInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: testApplicationUuid,
          applicationSection: "data",
          objects: [
            {
              uuid: testInstanceUuid,
              parentUuid: testEntityUuid,
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap
    );

    const snap = localCache.getState().presentModelSnapshot;
    expect(snap.current[partialIndex]?.segment?.freshness).toBe("stale");
    expect(snap.current[partialIndex]?.entities?.[testInstanceUuid]).toMatchObject({
      name: "partial-name",
    });
  });
});
