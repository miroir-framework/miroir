import { describe, expect, it } from "vitest";
import {
  estimateObjectBytes,
  measureLocalCacheMemory,
  type ApplicationDeploymentMap,
  type EntityInstance,
  type EntityInstanceCollection,
  type InstanceAction,
  type ModelAction,
  type TransactionalInstanceAction,
} from "miroir-core";
import {
  book1,
  book2,
  book3,
  deployment_Library_DO_NO_USE,
  entityBook,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import { LocalCache } from "../src/4_services/LocalCache.js";

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

const libraryBooks = [book1, book2, book3] as EntityInstance[];

function bootstrapLibraryBooks(localCache: LocalCache, books: EntityInstance[]): void {
  const instanceCollection: EntityInstanceCollection = {
    parentUuid: entityBook.uuid,
    applicationSection: "data",
    instances: books,
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

describe("LocalCache monitor API (Phase 3, redux)", () => {
  it("currentInfo localCacheSize equals presentSnapshotBytes from measureLocalCacheMemory", () => {
    const localCache = new LocalCache();
    bootstrapLibraryBooks(localCache, libraryBooks);

    const state = localCache.getState();
    const measured = measureLocalCacheMemory(state);
    const info = localCache.currentInfo();

    expect(info.localCacheSize).toBe(measured.presentSnapshotBytes);
    expect(info.localCacheSize).toBe(estimateObjectBytes(state.presentModelSnapshot));
  });

  it("currentInfo stays present-only (does not report effective/history size)", () => {
    const localCache = new LocalCache();
    bootstrapLibraryBooks(localCache, [book1 as EntityInstance]);

    // Must be transactional to land in pastModelPatches (undo history).
    const createBook2: Extract<InstanceAction, { actionType: "createInstance" }> = {
      actionType: "createInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "data",
        parentUuid: entityBook.uuid,
        objects: [book2 as EntityInstance],
      },
    };

    const transactionalCreate: TransactionalInstanceAction = {
      actionType: "transactionalInstanceAction",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: selfApplicationLibrary.uuid,
        instanceAction: createBook2,
      },
    };
    localCache.handleLocalCacheAction(transactionalCreate, applicationDeploymentMap);

    const state = localCache.getState();
    const measured = measureLocalCacheMemory(state);
    const info = localCache.currentInfo();

    expect(measured.transactionHistoryBytes).toBeGreaterThan(0);
    expect(info.localCacheSize).toBe(measured.presentSnapshotBytes);
    expect(info.localCacheSize).toBeLessThan(measured.effectiveBytes);
  });
});
