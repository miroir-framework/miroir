import {
  ACTION_OK,
  type ApplicationDeploymentMap,
  type EntityInstance,
  type EntityInstanceCollection,
  type InstanceAction,
  type ModelAction,
} from "miroir-core";

// import { LocalCache } from "miroir-localcache-redux";
import { LocalCache } from "miroir-localcache-zustand";

// ################################################################################################
// ################################################################################################
//  TEST CONSTANTS
const testApplicationUuid = "11111111-1111-1111-1111-111111111111";
const testDeploymentUuid = "22222222-2222-2222-2222-222222222222";
const testEntityUuid = "33333333-3333-3333-3333-333333333333";
const testInstanceUuid = "44444444-4444-4444-4444-444444444444";
const testInstance2Uuid = "55555555-5555-5555-5555-555555555555";

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [testApplicationUuid]: testDeploymentUuid,
};

const instanceEndpointUuid = "ed520de4-55a9-4550-ac50-b1b713b72a89" as const;
const modelEndpointUuid = "7947ae40-eb34-4149-887b-15a9021e714e" as const;

// ################################################################################################
//  HELPERS
// ################################################################################################

/**
 * Bootstraps a LocalCache by loading a set of instances into the "loading" zone
 * (via loadNewInstancesInLocalCache) and then committing them to "current" via rollback.
 *
 * This matches the real application lifecycle: loadNewInstancesInLocalCache + rollback
 * moves data from the loading staging zone into the live current zone.
 *
 * This is required before calling createInstance/updateInstance/deleteInstance, because
 * those operations rely on entity collections already existing as proper Immer draft
 * objects in state.current (assigning a freshly-created plain object to a draft and
 * immediately reading it back does not yield an Immer draft proxy in the current
 * Immer/RTK version).
 */
function bootstrapLocalCache(
  localCache: LocalCache,
  instances: EntityInstance[],
  entityUuid: string = testEntityUuid,
  applicationSection: "data" | "model" = "data"
): void {
  const instanceCollection: EntityInstanceCollection = {
    parentUuid: entityUuid,
    applicationSection,
    instances,
  };

  const loadAction: InstanceAction = {
    actionType: "loadNewInstancesInLocalCache",
    endpoint: instanceEndpointUuid,
    payload: {
      application: testApplicationUuid,
      objects: [instanceCollection],
    },
  };

  const rollbackAction: ModelAction = {
    actionType: "rollback",
    endpoint: modelEndpointUuid,
    payload: { application: testApplicationUuid },
  };

  localCache.handleLocalCacheAction(loadAction, applicationDeploymentMap);
  localCache.handleLocalCacheAction(rollbackAction, applicationDeploymentMap);
}

// ################################################################################################
// ################################################################################################

describe("LocalCache.unit.test", () => {
  // ##############################################################################################
  it("handleLocalCacheAction createInstance adds instance to domain state", () => {
    const localCache = new LocalCache();
    // Bootstrap: initialize the entity collection in state.current (required before CRUD)
    bootstrapLocalCache(localCache, []);

    const instance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      parentName: "TestEntity",
    };

    const createAction: InstanceAction = {
      actionType: "createInstance",
      endpoint: instanceEndpointUuid,
      payload: {
        application: testApplicationUuid,
        applicationSection: "data",
        parentUuid: testEntityUuid,
        objects: [instance],
      },
    };

    const result = localCache.handleLocalCacheAction(createAction, applicationDeploymentMap);

    expect(result).toEqual(ACTION_OK);

    const domainState = localCache.getDomainState();
    expect(domainState[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstanceUuid]).toEqual(instance);
  });

  // ##############################################################################################
  it("handleLocalCacheAction createInstance adds multiple instances to domain state", () => {
    const localCache = new LocalCache();
    // Bootstrap: initialize the entity collection in state.current (required before CRUD)
    bootstrapLocalCache(localCache, []);

    const instance1: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      parentName: "TestEntity",
    };
    const instance2: EntityInstance = {
      uuid: testInstance2Uuid,
      parentUuid: testEntityUuid,
      parentName: "TestEntity",
    };

    const createAction: InstanceAction = {
      actionType: "createInstance",
      endpoint: instanceEndpointUuid,
      payload: {
        application: testApplicationUuid,
        applicationSection: "data",
        parentUuid: testEntityUuid,
        objects: [instance1, instance2],
      },
    };

    const result = localCache.handleLocalCacheAction(createAction, applicationDeploymentMap);

    expect(result).toEqual(ACTION_OK);

    const domainState = localCache.getDomainState();
    expect(domainState[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstanceUuid]).toEqual(instance1);
    expect(domainState[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstance2Uuid]).toEqual(instance2);
  });

  // ##############################################################################################
  it("handleLocalCacheAction updateInstance updates instance in domain state", () => {
    const localCache = new LocalCache();
    const instance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      parentName: "TestEntity",
    };
    // Bootstrap: pre-load the instance so it's in state.current
    bootstrapLocalCache(localCache, [instance]);

    const updatedInstance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      parentName: "UpdatedEntity",
    };

    const updateAction: InstanceAction = {
      actionType: "updateInstance",
      endpoint: instanceEndpointUuid,
      payload: {
        application: testApplicationUuid,
        applicationSection: "data",
        parentUuid: testEntityUuid,
        objects: [updatedInstance],
      },
    };

    const result = localCache.handleLocalCacheAction(updateAction, applicationDeploymentMap);

    expect(result).toEqual(ACTION_OK);

    const domainState = localCache.getDomainState();
    expect(domainState[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstanceUuid]).toEqual(updatedInstance);
    expect(domainState[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstanceUuid]?.parentName).toBe(
      "UpdatedEntity"
    );
  });

  // ##############################################################################################
  it("handleLocalCacheAction deleteInstance removes instance from domain state", () => {
    const localCache = new LocalCache();
    const instance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      parentName: "TestEntity",
    };
    // Bootstrap: pre-load the instance so it's in state.current
    bootstrapLocalCache(localCache, [instance]);

    const domainStateAfterLoad = localCache.getDomainState();
    expect(domainStateAfterLoad[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstanceUuid]).toBeDefined();

    const deleteAction: InstanceAction = {
      actionType: "deleteInstance",
      endpoint: instanceEndpointUuid,
      payload: {
        application: testApplicationUuid,
        applicationSection: "data",
        parentUuid: testEntityUuid,
        objects: [instance],
      },
    };

    const result = localCache.handleLocalCacheAction(deleteAction, applicationDeploymentMap);

    expect(result).toEqual(ACTION_OK);

    const domainStateAfterDelete = localCache.getDomainState();
    expect(
      domainStateAfterDelete[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstanceUuid]
    ).toBeUndefined();
  });

  // ##############################################################################################
  it("handleLocalCacheAction delete only removes targeted instance, leaves others intact", () => {
    const localCache = new LocalCache();
    const instance1: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      parentName: "TestEntity",
    };
    const instance2: EntityInstance = {
      uuid: testInstance2Uuid,
      parentUuid: testEntityUuid,
      parentName: "TestEntity",
    };
    // Bootstrap: pre-load both instances so they're in state.current
    bootstrapLocalCache(localCache, [instance1, instance2]);

    const deleteAction: InstanceAction = {
      actionType: "deleteInstance",
      endpoint: instanceEndpointUuid,
      payload: {
        application: testApplicationUuid,
        applicationSection: "data",
        parentUuid: testEntityUuid,
        objects: [instance1],
      },
    };
    const result = localCache.handleLocalCacheAction(deleteAction, applicationDeploymentMap);

    expect(result).toEqual(ACTION_OK);

    const domainState = localCache.getDomainState();
    expect(domainState[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstanceUuid]).toBeUndefined();
    expect(domainState[testDeploymentUuid]?.data?.[testEntityUuid]?.[testInstance2Uuid]).toEqual(instance2);
  });

  // ##############################################################################################
  it("handleLocalCacheAction createInstance works for model section", () => {
    const localCache = new LocalCache();
    // Bootstrap: initialize the model entity collection in state.current
    bootstrapLocalCache(localCache, [], testEntityUuid, "model");

    const instance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuid,
      parentName: "TestModelEntity",
    };

    const createAction: InstanceAction = {
      actionType: "createInstance",
      endpoint: instanceEndpointUuid,
      payload: {
        application: testApplicationUuid,
        applicationSection: "model",
        parentUuid: testEntityUuid,
        objects: [instance],
      },
    };

    const result = localCache.handleLocalCacheAction(createAction, applicationDeploymentMap);

    expect(result).toEqual(ACTION_OK);

    const domainState = localCache.getDomainState();
    expect(domainState[testDeploymentUuid]?.model?.[testEntityUuid]?.[testInstanceUuid]).toEqual(instance);
  });
});
