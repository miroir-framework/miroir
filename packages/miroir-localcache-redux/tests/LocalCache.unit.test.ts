import {
  ACTION_OK,
  entityDefinitionEntityDefinition,
  type ApplicationDeploymentMap,
  type EntityInstance,
  type EntityInstanceCollection,
  type InstanceAction,
  type ModelAction,
} from "miroir-core";

import { LocalCache } from "../src/4_services/LocalCache";

// ################################################################################################
// ################################################################################################
//  TEST CONSTANTS
const testApplicationUuid = "11111111-1111-1111-1111-111111111111";
const testDeploymentUuid = "22222222-2222-2222-2222-222222222222";
const testEntityUuid = "33333333-3333-3333-3333-333333333333";
const testInstanceUuid = "44444444-4444-4444-4444-444444444444";
const testInstance2Uuid = "55555555-5555-5555-5555-555555555555";

// Entity with non-UUID primary key ("name" attribute)
const testEntityUuidWithCustomPK = "66666666-6666-6666-6666-666666666666";
const testCustomPKInstance1Name = "instance-alpha";
const testCustomPKInstance2Name = "instance-beta";

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [testApplicationUuid]: testDeploymentUuid,
};


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
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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

// ################################################################################################
// ################################################################################################
// Tests for entities with non-UUID primary key (idAttribute)
// ################################################################################################
// ################################################################################################

/**
 * Registers a custom EntityAdapter (via loadNewInstancesInLocalCache with EntityDefinition instances)
 * for an entity that uses a non-UUID primary key, then bootstraps the entity collection.
 *
 * Loading an EntityDefinition instance with parentUuid = entityDefinitionEntityDefinition.uuid
 * triggers registerEntityAdapterFromDefinition inside loadNewEntityInstancesInLocalCache.
 * The section must match the one used for the entity's data instances.
 */
function bootstrapLocalCacheWithCustomPK(
  localCache: LocalCache,
  entityUuid: string,
  idAttribute: string,
  instances: EntityInstance[],
  applicationSection: "data" | "model" = "model"
): void {
  // Step 1: Load a mock EntityDefinition to trigger custom adapter registration.
  // The EntityDefinition instances must be loaded with parentUuid = entityDefinitionEntityDefinition.uuid.
  // The section must match the section used for the entity's data (model here, since that's
  // how registerEntityAdapterFromDefinition indexes the adapter: by (deploymentUuid, section, entityUuid)).
  const mockEntityDefinitionInstance: EntityInstance = {
    uuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    parentUuid: entityDefinitionEntityDefinition.uuid,
    entityUuid,
    idAttribute,
    name: "TestEntityWithCustomPK",
  } as any;

  const loadEntityDefsAction: InstanceAction = {
    actionType: "loadNewInstancesInLocalCache",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: testApplicationUuid,
      objects: [
        {
          parentUuid: entityDefinitionEntityDefinition.uuid,
          applicationSection,
          instances: [mockEntityDefinitionInstance],
        } as EntityInstanceCollection,
      ],
    },
  };
  localCache.handleLocalCacheAction(loadEntityDefsAction, applicationDeploymentMap);

  // Step 2: Bootstrap the entity's instance collection (loadNewInstances + rollback).
  bootstrapLocalCache(localCache, instances, entityUuid, applicationSection);
}

describe("LocalCache.unit.test - custom idAttribute", () => {
  // ##############################################################################################
  it("createInstance stores instance keyed by custom idAttribute (name), not uuid", () => {
    const localCache = new LocalCache();
    bootstrapLocalCacheWithCustomPK(localCache, testEntityUuidWithCustomPK, "name", []);

    const instance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuidWithCustomPK,
      parentName: "TestEntityWithCustomPK",
      name: testCustomPKInstance1Name,
    } as any;

    const createAction: InstanceAction = {
      actionType: "createInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: testApplicationUuid,
        applicationSection: "model",
        parentUuid: testEntityUuidWithCustomPK,
        objects: [instance],
      },
    };

    const result = localCache.handleLocalCacheAction(createAction, applicationDeploymentMap);
    expect(result).toEqual(ACTION_OK);

    const domainState = localCache.getDomainState();
    const entityInstances = domainState[testDeploymentUuid]?.model?.[testEntityUuidWithCustomPK];
    // Instance must be retrievable by name (custom PK), not by uuid
    expect(entityInstances?.[testCustomPKInstance1Name]).toEqual(instance);
    // Must NOT be stored under uuid key
    expect(entityInstances?.[testInstanceUuid]).toBeUndefined();
  });

  // ##############################################################################################
  it("createInstance stores multiple instances keyed by custom idAttribute", () => {
    const localCache = new LocalCache();
    bootstrapLocalCacheWithCustomPK(localCache, testEntityUuidWithCustomPK, "name", []);

    const instance1: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuidWithCustomPK,
      parentName: "TestEntityWithCustomPK",
      name: testCustomPKInstance1Name,
    } as any;
    const instance2: EntityInstance = {
      uuid: testInstance2Uuid,
      parentUuid: testEntityUuidWithCustomPK,
      parentName: "TestEntityWithCustomPK",
      name: testCustomPKInstance2Name,
    } as any;

    const createAction: InstanceAction = {
      actionType: "createInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: testApplicationUuid,
        applicationSection: "model",
        parentUuid: testEntityUuidWithCustomPK,
        objects: [instance1, instance2],
      },
    };

    const result = localCache.handleLocalCacheAction(createAction, applicationDeploymentMap);
    expect(result).toEqual(ACTION_OK);

    const domainState = localCache.getDomainState();
    const entityInstances = domainState[testDeploymentUuid]?.model?.[testEntityUuidWithCustomPK];
    expect(entityInstances?.[testCustomPKInstance1Name]).toEqual(instance1);
    expect(entityInstances?.[testCustomPKInstance2Name]).toEqual(instance2);
    expect(entityInstances?.[testInstanceUuid]).toBeUndefined();
    expect(entityInstances?.[testInstance2Uuid]).toBeUndefined();
  });

  // ##############################################################################################
  it("updateInstance updates instance keyed by custom idAttribute", () => {
    const localCache = new LocalCache();
    const instance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuidWithCustomPK,
      parentName: "TestEntityWithCustomPK",
      name: testCustomPKInstance1Name,
      description: "original",
    } as any;
    bootstrapLocalCacheWithCustomPK(localCache, testEntityUuidWithCustomPK, "name", [instance]);

    const updatedInstance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuidWithCustomPK,
      parentName: "TestEntityWithCustomPK",
      name: testCustomPKInstance1Name,
      description: "updated",
    } as any;

    const updateAction: InstanceAction = {
      actionType: "updateInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: testApplicationUuid,
        applicationSection: "model",
        parentUuid: testEntityUuidWithCustomPK,
        objects: [updatedInstance],
      },
    };

    const result = localCache.handleLocalCacheAction(updateAction, applicationDeploymentMap);
    expect(result).toEqual(ACTION_OK);

    const domainState = localCache.getDomainState();
    const entityInstances = domainState[testDeploymentUuid]?.model?.[testEntityUuidWithCustomPK];
    expect((entityInstances?.[testCustomPKInstance1Name] as any)?.description).toBe("updated");
  });

  // ##############################################################################################
  it("deleteInstance removes instance keyed by custom idAttribute", () => {
    const localCache = new LocalCache();
    const instance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuidWithCustomPK,
      parentName: "TestEntityWithCustomPK",
      name: testCustomPKInstance1Name,
    } as any;
    bootstrapLocalCacheWithCustomPK(localCache, testEntityUuidWithCustomPK, "name", [instance]);

    // Verify instance is present before delete
    const domainStateBefore = localCache.getDomainState();
    expect(domainStateBefore[testDeploymentUuid]?.model?.[testEntityUuidWithCustomPK]?.[testCustomPKInstance1Name]).toBeDefined();

    const deleteAction: InstanceAction = {
      actionType: "deleteInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: testApplicationUuid,
        applicationSection: "model",
        parentUuid: testEntityUuidWithCustomPK,
        objects: [instance],
      },
    };

    const result = localCache.handleLocalCacheAction(deleteAction, applicationDeploymentMap);
    expect(result).toEqual(ACTION_OK);

    const domainStateAfter = localCache.getDomainState();
    expect(
      domainStateAfter[testDeploymentUuid]?.model?.[testEntityUuidWithCustomPK]?.[testCustomPKInstance1Name]
    ).toBeUndefined();
  });

  // ##############################################################################################
  it("loadNewInstancesInLocalCache stores pre-loaded instances keyed by custom idAttribute", () => {
    const localCache = new LocalCache();
    const instance: EntityInstance = {
      uuid: testInstanceUuid,
      parentUuid: testEntityUuidWithCustomPK,
      parentName: "TestEntityWithCustomPK",
      name: testCustomPKInstance1Name,
    } as any;
    // bootstrapLocalCacheWithCustomPK calls loadNewInstances + rollback with the instance
    bootstrapLocalCacheWithCustomPK(localCache, testEntityUuidWithCustomPK, "name", [instance]);

    const domainState = localCache.getDomainState();
    const entityInstances = domainState[testDeploymentUuid]?.model?.[testEntityUuidWithCustomPK];
    expect(entityInstances?.[testCustomPKInstance1Name]).toEqual(instance);
    expect(entityInstances?.[testInstanceUuid]).toBeUndefined();
  });
});
