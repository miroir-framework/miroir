import { describe, expect, it } from "vitest";
import {
  estimateObjectBytes,
  measureLocalCacheMemory,
  type ApplicationDeploymentMap,
  type EntityInstance,
  type EntityInstanceCollection,
  type InstanceAction,
  type ModelAction,
} from "miroir-core";

import { LocalCache } from "../src/4_services/LocalCache.js";

// Keep in sync with miroir-localcache-zustand/.../LocalCache.memoryMeasure.static.unit.test.ts
const testApplicationUuid = "11111111-1111-1111-1111-111111111111";
const testDeploymentUuid = "22222222-2222-2222-2222-222222222222";
const testEntityUuid = "33333333-3333-3333-3333-333333333333";
const testInstanceUuid = "44444444-4444-4444-4444-444444444444";
const STATIC_MEMORY_INSTANCE_BODY = "Phase211Static-" + "M".repeat(4000);

/**
 * Locked after first redux green (Phase 2.1, 2026-07-21). Zustand asserts the same golden (2.3).
 * Recompute only if the bootstrap payload above changes.
 */
const EXPECTED_PRESENT_SNAPSHOT_BYTES = 8646;

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [testApplicationUuid]: testDeploymentUuid,
};

function bootstrapStaticLocalCache(localCache: LocalCache): void {
  const instance: EntityInstance = {
    uuid: testInstanceUuid,
    parentUuid: testEntityUuid,
    parentName: "TestEntity",
    body: STATIC_MEMORY_INSTANCE_BODY,
  } as EntityInstance;

  const instanceCollection: EntityInstanceCollection = {
    parentUuid: testEntityUuid,
    applicationSection: "data",
    instances: [instance],
  };

  const loadAction: InstanceAction = {
    actionType: "loadNewInstancesInLocalCache",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: testApplicationUuid,
      objects: [instanceCollection],
    },
  };

  const rollbackAction: ModelAction = {
    actionType: "rollback",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: { application: testApplicationUuid },
  };

  localCache.handleLocalCacheAction(loadAction, applicationDeploymentMap);
  localCache.handleLocalCacheAction(rollbackAction, applicationDeploymentMap);
}

describe("LocalCache memory measure — static image (Phase 2, redux)", () => {
  it("static redux LocalCache: measureLocalCacheMemory parts sum and present matches walk", () => {
    const localCache = new LocalCache();
    bootstrapStaticLocalCache(localCache);

    const state = localCache.getState();
    const measured = measureLocalCacheMemory(state);
    const presentAlone = estimateObjectBytes(state.presentModelSnapshot);

    expect(measured.presentSnapshotBytes).toBeGreaterThan(0);
    expect(measured.presentSnapshotBytes).toBe(presentAlone);
    expect(measured.effectiveBytes).toBe(
      measured.presentSnapshotBytes +
        measured.transactionHistoryBytes +
        measured.queriesResultsCacheBytes
    );
  });

  it("presentSnapshotBytes matches shared golden for identical bootstrap payload", () => {
    const localCache = new LocalCache();
    bootstrapStaticLocalCache(localCache);

    const measured = measureLocalCacheMemory(localCache.getState());
    expect(measured.presentSnapshotBytes).toBe(EXPECTED_PRESENT_SNAPSHOT_BYTES);
  });

  it("after rollback bootstrap, history incremental is small relative to present", () => {
    const localCache = new LocalCache();
    bootstrapStaticLocalCache(localCache);

    const measured = measureLocalCacheMemory(localCache.getState());
    expect(measured.transactionHistoryBytes).toBeLessThan(
      measured.presentSnapshotBytes / 5
    );
  });
});
