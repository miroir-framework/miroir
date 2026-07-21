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
import {
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  deployment_Library_DO_NO_USE,
  entityBook,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import { LocalCache } from "../src/4_services/LocalCache.js";

// Keep in sync with miroir-localcache-redux/.../LocalCache.memoryMeasure.static.unit.test.ts
const libraryBooks = [book1, book2, book3, book4, book5, book6];

/** Same golden as redux Phase 2 Library Books bootstrap (D15). */
const EXPECTED_PRESENT_SNAPSHOT_BYTES = 3922;

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

function bootstrapLibraryBooks(localCache: LocalCache): void {
  const instanceCollection: EntityInstanceCollection = {
    parentUuid: entityBook.uuid,
    applicationSection: "data",
    instances: libraryBooks as EntityInstance[],
  };

  const loadAction: InstanceAction = {
    actionType: "loadNewInstancesInLocalCache",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: selfApplicationLibrary.uuid,
      objects: [instanceCollection],
    },
  };

  const rollbackAction: ModelAction = {
    actionType: "rollback",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: { application: selfApplicationLibrary.uuid },
  };

  localCache.handleLocalCacheAction(loadAction, applicationDeploymentMap);
  localCache.handleLocalCacheAction(rollbackAction, applicationDeploymentMap);
}

describe("LocalCache memory measure — static Library image (Phase 2, zustand)", () => {
  it("static zustand LocalCache: measureLocalCacheMemory parts sum and present matches walk", () => {
    const localCache = new LocalCache();
    bootstrapLibraryBooks(localCache);

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

  it("presentSnapshotBytes matches shared golden for identical Library Books bootstrap", () => {
    const localCache = new LocalCache();
    bootstrapLibraryBooks(localCache);

    const measured = measureLocalCacheMemory(localCache.getState());
    expect(measured.presentSnapshotBytes).toBe(EXPECTED_PRESENT_SNAPSHOT_BYTES);
  });

  it("after rollback bootstrap, history incremental is small relative to present", () => {
    const localCache = new LocalCache();
    bootstrapLibraryBooks(localCache);

    const measured = measureLocalCacheMemory(localCache.getState());
    expect(measured.transactionHistoryBytes).toBeLessThan(
      measured.presentSnapshotBytes / 5
    );
  });
});
