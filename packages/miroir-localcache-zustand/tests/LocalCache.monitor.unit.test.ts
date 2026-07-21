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

describe("LocalCache monitor API (Phase 3, zustand)", () => {
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

describe("LocalCache monitor session (Phase 5, zustand)", () => {
  it("attributed map tracks create, update, delete", () => {
    const localCache = new LocalCache();
    bootstrapLibraryBooks(localCache, [book1 as EntityInstance]);
    localCache.setLocalCacheMonitorEnabled(true);

    expect(localCache.getLocalCacheMonitorSnapshot()).not.toBeNull();
    expect(
      localCache.getLocalCacheMonitorSnapshot()!.attributedInstances.map((r) => r.instanceId)
    ).toEqual([book1.uuid]);

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
    localCache.handleLocalCacheAction(createBook2, applicationDeploymentMap);

    let ids = localCache
      .getLocalCacheMonitorSnapshot()!
      .attributedInstances.map((r) => r.instanceId);
    expect(ids).toContain(book1.uuid);
    expect(ids).toContain(book2.uuid);

    const book2Before = localCache
      .getLocalCacheMonitorSnapshot()!
      .attributedInstances.find((r) => r.instanceId === book2.uuid)!;
    const enlargedBook2 = {
      ...(book2 as EntityInstance),
      name: `${(book2 as EntityInstance).name ?? "book2"}-${"X".repeat(200)}`,
    };
    const updateBook2: Extract<InstanceAction, { actionType: "updateInstance" }> = {
      actionType: "updateInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "data",
        parentUuid: entityBook.uuid,
        objects: [enlargedBook2],
      },
    };
    localCache.handleLocalCacheAction(updateBook2, applicationDeploymentMap);

    const book2After = localCache
      .getLocalCacheMonitorSnapshot()!
      .attributedInstances.find((r) => r.instanceId === book2.uuid)!;
    expect(book2After.bytes).toBeGreaterThan(book2Before.bytes);

    const deleteBook2: Extract<InstanceAction, { actionType: "deleteInstance" }> = {
      actionType: "deleteInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "data",
        parentUuid: entityBook.uuid,
        objects: [enlargedBook2],
      },
    };
    localCache.handleLocalCacheAction(deleteBook2, applicationDeploymentMap);

    ids = localCache
      .getLocalCacheMonitorSnapshot()!
      .attributedInstances.map((r) => r.instanceId);
    expect(ids).toEqual([book1.uuid]);
  });

  it("commit drops transaction history incremental size", () => {
    const localCache = new LocalCache();
    bootstrapLibraryBooks(localCache, [book1 as EntityInstance]);
    localCache.setLocalCacheMonitorEnabled(true);

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

    const historyBefore = localCache.getLocalCacheMonitorSnapshot()!.breakdown
      .transactionHistoryBytes;
    expect(historyBefore).toBeGreaterThan(0);

    const commit: ModelAction = {
      actionType: "commit",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: selfApplicationLibrary.uuid },
    };
    localCache.handleLocalCacheAction(commit, applicationDeploymentMap);

    const historyAfter = localCache.getLocalCacheMonitorSnapshot()!.breakdown
      .transactionHistoryBytes;
    expect(historyAfter).toBeLessThan(historyBefore);
  });

  it("after undo, monitor snapshot matches fresh measureLocalCacheMemory", () => {
    const localCache = new LocalCache();
    bootstrapLibraryBooks(localCache, [book1 as EntityInstance]);
    localCache.setLocalCacheMonitorEnabled(true);

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

    // Zustand undo is exposed as a store method (handleLocalCacheAction undo is a no-op in the slice).
    localCache.undo();

    const snapshot = localCache.getLocalCacheMonitorSnapshot()!;
    const fresh = measureLocalCacheMemory(localCache.getState());
    expect(snapshot.breakdown).toEqual(fresh);
    expect(snapshot.attributedInstances.map((r) => r.instanceId)).toEqual([book1.uuid]);
  });
});
