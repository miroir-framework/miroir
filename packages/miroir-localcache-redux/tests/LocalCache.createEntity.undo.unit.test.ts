import {
  ACTION_OK,
  type ApplicationDeploymentMap,
  type EntityInstance,
  type InstanceAction,
  type ModelAction,
  type UndoRedoAction,
} from "miroir-core";
import {
  entityEntity,
  entityEntityVersion,
} from "miroir-test-app_deployment-miroir";
import {
  entityAuthor,
  entityBook,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { deployment_Library_DO_NO_USE } from "miroir-test-app_deployment-library";

import { LocalCache } from "../src/4_services/LocalCache";

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

function bootstrapModelEntityCollections(
  localCache: LocalCache,
  entityUuids: string[],
): void {
  const loadAction: InstanceAction = {
    actionType: "loadNewInstancesInLocalCache",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: selfApplicationLibrary.uuid,
      objects: entityUuids.map((entityUuid) => ({
        parentUuid: entityUuid,
        applicationSection: "model" as const,
        instances: [] as EntityInstance[],
      })),
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

function entityCount(localCache: LocalCache): number {
  const domainState = localCache.getDomainState();
  const entities =
    domainState[deployment_Library_DO_NO_USE.uuid]?.model?.[entityEntity.uuid] ?? {};
  return Object.keys(entities).length;
}

describe("LocalCache createEntity undo/redo (Entity-only create)", () => {
  it("records createEntity on the undo stack and undoes Entity instances", () => {
    const localCache = new LocalCache();
    // Load Entity + EntityVersion together then rollback once — sequential
    // load/rollback pairs wipe prior deployment collections from `current`.
    bootstrapModelEntityCollections(localCache, [
      entityEntity.uuid,
      entityEntityVersion.uuid,
    ]);

    const createAuthor: ModelAction = {
      actionType: "createEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: selfApplicationLibrary.uuid,
        entities: [entityAuthor as any],
      },
    };
    const createBook: ModelAction = {
      actionType: "createEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: selfApplicationLibrary.uuid,
        entities: [entityBook as any],
      },
    };

    expect(localCache.handleLocalCacheAction(createAuthor, applicationDeploymentMap)).toEqual(ACTION_OK);
    expect(entityCount(localCache)).toBe(1);
    expect(localCache.currentTransaction().length).toBe(1);

    expect(localCache.handleLocalCacheAction(createBook, applicationDeploymentMap)).toEqual(ACTION_OK);
    expect(entityCount(localCache)).toBe(2);
    expect(localCache.currentTransaction().length).toBe(2);

    const undo: UndoRedoAction = {
      actionType: "undo",
      endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
      payload: { application: selfApplicationLibrary.uuid },
    };
    expect(localCache.handleLocalCacheAction(undo, applicationDeploymentMap)).toEqual(ACTION_OK);
    expect(entityCount(localCache)).toBe(1);
    expect(localCache.currentTransaction().length).toBe(1);

    expect(localCache.handleLocalCacheAction(undo, applicationDeploymentMap)).toEqual(ACTION_OK);
    expect(entityCount(localCache)).toBe(0);
    expect(localCache.currentTransaction().length).toBe(0);

    const redo: UndoRedoAction = {
      actionType: "redo",
      endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
      payload: { application: selfApplicationLibrary.uuid },
    };
    expect(localCache.handleLocalCacheAction(redo, applicationDeploymentMap)).toEqual(ACTION_OK);
    expect(entityCount(localCache)).toBe(1);
    expect(localCache.handleLocalCacheAction(redo, applicationDeploymentMap)).toEqual(ACTION_OK);
    expect(entityCount(localCache)).toBe(2);
  });
});
