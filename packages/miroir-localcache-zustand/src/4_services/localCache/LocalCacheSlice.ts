/**
 * Local Cache Slice implementation for Zustand.
 * Handles entity instance management and local cache operations.
 */

import {
  ApplicationSection,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  InstanceAction,
  LocalCacheAction,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelAction,
  Uuid,
  getLocalCacheIndexDeploymentSection,
  getLocalCacheIndexDeploymentUuid,
  getLocalCacheIndexEntityUuid,
  getReduxDeploymentsStateIndex,
  type ApplicationDeploymentMap
} from "miroir-core";

import type { LocalCacheSliceState, LocalCacheSliceStateZone } from "./localCacheZustandInterface.js";

const packageName = "miroir-localcache-zustand";
const cleanLevel = "5_view";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSlice")
).then((logger: LoggerInterface) => {log = logger});

//#########################################################################################
// Utility functions
//#########################################################################################
export function getLocalCacheKeysForDeploymentUuid(localCacheKeys: string[], deploymentUuid: Uuid): string[] {
  return localCacheKeys.filter(k => k.match(new RegExp(`^${deploymentUuid}_`)));
}

export function getLocalCacheKeysForDeploymentSection(localCacheKeys: string[], section: string): string[] {
  return localCacheKeys.filter(k => k.match(new RegExp(`_${section}_`)));
}

export function getDeploymentUuidListFromLocalCacheKeys(localCacheKeys: string[]): Uuid[] {
  const resultSet = new Set<Uuid>();
  localCacheKeys.forEach(k => {
    const deploymentUuid = getLocalCacheIndexDeploymentUuid(k);
    if (deploymentUuid) resultSet.add(deploymentUuid);
  });
  return Array.from(resultSet.keys());
}

export function getLocalCacheKeysDeploymentSectionList(localCacheKeys: string[], deploymentUuid: Uuid): string[] {
  const resultSet = new Set<string>();
  getLocalCacheKeysForDeploymentUuid(localCacheKeys, deploymentUuid)
    .forEach(k => {
      const section = getLocalCacheIndexDeploymentSection(k);
      if (section) resultSet.add(section);
    });
  return Array.from(resultSet.keys());
}

export function getLocalCacheKeysDeploymentSectionEntitiesList(
  localCacheKeys: string[],
  deploymentUuid: Uuid,
  section: string
): Uuid[] {
  const deploymentKeys = getLocalCacheKeysForDeploymentUuid(localCacheKeys, deploymentUuid);
  const sectionKeys = getLocalCacheKeysForDeploymentSection(deploymentKeys, section);
  return sectionKeys.map((k) => getLocalCacheIndexEntityUuid(k));
}

//#########################################################################################
// State to domain state conversion
//#########################################################################################
export function localCacheStateToDomainState(localCache: LocalCacheSliceState): DomainState {
  const localCacheKeys = Object.keys(localCache.current);
  const deployments = getDeploymentUuidListFromLocalCacheKeys(localCacheKeys);
  return Object.fromEntries(
    deployments.map(deploymentUuid => {
      const deploymentLocalCacheKeys = getLocalCacheKeysForDeploymentUuid(localCacheKeys, deploymentUuid);
      const sections = getLocalCacheKeysDeploymentSectionList(deploymentLocalCacheKeys, deploymentUuid);
      return [
        deploymentUuid,
        Object.fromEntries(
          sections.map(section => {
            const sectionLocalCacheKeys = getLocalCacheKeysForDeploymentSection(deploymentLocalCacheKeys, section);
            return [
              section,
              Object.fromEntries(
                sectionLocalCacheKeys.map(k => [
                  getLocalCacheIndexEntityUuid(k),
                  localCache.current[k]?.entities as EntityInstancesUuidIndex ?? {}
                ])
              )
            ];
          })
        )
      ];
    })
  );
}

//#########################################################################################
// Entity State management (replaces Redux EntityAdapter)
//#########################################################################################
interface EntityState {
  ids: string[];
  entities: Record<string, EntityInstance>;
}

function getInitialEntityState(): EntityState {
  return { ids: [], entities: {} };
}

function addManyToEntityState(state: EntityState, instances: EntityInstance[]): EntityState {
  const newIds = [...state.ids];
  const newEntities = { ...state.entities };
  
  for (const instance of instances) {
    if (!newEntities[instance.uuid]) {
      newIds.push(instance.uuid);
    }
    newEntities[instance.uuid] = instance;
  }
  
  return { ids: newIds, entities: newEntities };
}

function setAllInEntityState(instances: EntityInstance[]): EntityState {
  return {
    ids: instances.map(i => i.uuid),
    entities: Object.fromEntries(instances.map(i => [i.uuid, i]))
  };
}

function updateOneInEntityState(state: EntityState, instance: EntityInstance): EntityState {
  if (!state.entities[instance.uuid]) {
    return state;
  }
  return {
    ids: state.ids,
    entities: { ...state.entities, [instance.uuid]: instance }
  };
}

function removeOneFromEntityState(state: EntityState, id: string): EntityState {
  if (!state.entities[id]) {
    return state;
  }
  const newEntities = { ...state.entities };
  delete newEntities[id];
  return {
    ids: state.ids.filter(i => i !== id),
    entities: newEntities
  };
}

function removeManyFromEntityState(state: EntityState, ids: string[]): EntityState {
  const idsSet = new Set(ids);
  const newEntities = { ...state.entities };
  ids.forEach(id => delete newEntities[id]);
  return {
    ids: state.ids.filter(i => !idsSet.has(i)),
    entities: newEntities
  };
}

//#########################################################################################
// Initialize entity state for a deployment/section/entity
//#########################################################################################
function initializeLocalCacheSliceState(
  deploymentUuid: string,
  section: ApplicationSection,
  entityUuid: string,
  zone: LocalCacheSliceStateZone,
  state: LocalCacheSliceState
): void {
  const entityInstancesLocationIndex = getReduxDeploymentsStateIndex(deploymentUuid, section, entityUuid);
  if (!(state as any)[zone][entityInstancesLocationIndex]) {
    (state as any)[zone][entityInstancesLocationIndex] = getInitialEntityState();
  }
}

//#########################################################################################
// Main action handler - mutates state (called within Immer produce)
//#########################################################################################
export function handleLocalCacheAction(
  state: LocalCacheSliceState,
  action: LocalCacheAction,
  applicationDeploymentMap: ApplicationDeploymentMap
): void {
  if (!action || typeof action !== 'object') {
    log.warn("handleLocalCacheAction received invalid action", action);
    return;
  }

  const actionType = (action as any).actionType;
  
  switch (actionType) {
    case "createInstance":
    case "deleteInstance":
    case "updateInstance": {
      handleInstanceAction(state, action as InstanceAction, applicationDeploymentMap);
      break;
    }
    case "transactionalInstanceAction": {
      // Unwrap the inner instanceAction and process it
      const innerAction = (action as any).payload?.instanceAction;
      if (innerAction) {
        handleInstanceAction(state, innerAction as InstanceAction, applicationDeploymentMap);
      } else {
        log.warn("transactionalInstanceAction missing payload.instanceAction", action);
      }
      break;
    }
    case "loadNewInstancesInLocalCache": {
      handleLoadNewInstancesAction(state, action, applicationDeploymentMap);
      break;
    }
    case "modelAction":
    case "initModel":
    case "commit":
    case "rollback":
    case "resetModel":
    case "resetData":
    case "createEntity":
    case "dropEntity":
    case "renameEntity":
    case "alterEntityAttribute": {
      handleModelAction(state, action as ModelAction, applicationDeploymentMap);
      break;
    }
    default: {
      log.debug("handleLocalCacheAction unhandled action type", actionType);
    }
  }
}

//#########################################################################################
// Handle instance actions
//#########################################################################################
function handleInstanceAction(
  state: LocalCacheSliceState,
  instanceAction: InstanceAction,
  applicationDeploymentMap: ApplicationDeploymentMap
): void {
  const deploymentUuid = applicationDeploymentMap[instanceAction.payload.application];
  
  switch (instanceAction.actionType) {
    case "createInstance": {
      for (const instanceCollection of instanceAction.payload.objects ?? []) {
        const index = getReduxDeploymentsStateIndex(
          deploymentUuid,
          instanceAction.payload.applicationSection ?? "data",
          instanceCollection.parentUuid
        );
        
        initializeLocalCacheSliceState(
          deploymentUuid,
          instanceAction.payload.applicationSection ?? "data",
          instanceCollection.parentUuid,
          "current",
          state
        );
        
        const currentState = state.current[index] as EntityState;
        state.current[index] = addManyToEntityState(currentState, instanceCollection.instances);
      }
      break;
    }
    case "deleteInstance": {
      for (const instanceCollection of instanceAction.payload.objects ?? []) {
        const index = getReduxDeploymentsStateIndex(
          deploymentUuid,
          instanceAction.payload.applicationSection,
          instanceCollection.parentUuid
        );
        
        if (state.current[index]) {
          const ids = instanceCollection.instances.map((i: EntityInstance) => i.uuid);
          state.current[index] = removeManyFromEntityState(state.current[index] as EntityState, ids);
        }
      }
      break;
    }
    case "updateInstance": {
      for (const instanceCollection of instanceAction.payload.objects ?? []) {
        const index = getReduxDeploymentsStateIndex(
          deploymentUuid,
          instanceAction.payload.applicationSection,
          instanceCollection.parentUuid
        );
        
        if (state.current[index]) {
          let currentState = state.current[index] as EntityState;
          for (const instance of instanceCollection.instances) {
            currentState = updateOneInEntityState(currentState, instance);
          }
          state.current[index] = currentState;
        }
      }
      break;
    }
  }
}

//#########################################################################################
// Handle load new instances action
//#########################################################################################
function handleLoadNewInstancesAction(
  state: LocalCacheSliceState,
  action: any,
  applicationDeploymentMap: ApplicationDeploymentMap
): void {
  const deploymentUuid = applicationDeploymentMap[action.payload.application];
  
  for (const instanceCollection of action.payload.objects ?? []) {
    const index = getReduxDeploymentsStateIndex(
      deploymentUuid,
      instanceCollection.applicationSection ?? "data",
      instanceCollection.parentUuid
    );
    
    initializeLocalCacheSliceState(
      deploymentUuid,
      instanceCollection.applicationSection ?? "data",
      instanceCollection.parentUuid,
      "loading",
      state
    );
    
    // Normalize dates for serialization
    const instances = (instanceCollection.instances ?? []).map((i: EntityInstance) =>
      (i as any)["createdAt"]
        ? {
            ...i,
            createdAt: new Date((i as any)["createdAt"]).getTime(),
            updatedAt: new Date((i as any)["updatedAt"]).getTime(),
          }
        : i
    );
    
    state.loading[index] = setAllInEntityState(instances);
  }
}

//#########################################################################################
// Handle model actions
//#########################################################################################
function handleModelAction(
  state: LocalCacheSliceState,
  modelAction: ModelAction,
  applicationDeploymentMap: ApplicationDeploymentMap
): void {
  const deploymentUuid = applicationDeploymentMap[modelAction.payload.application];
  
  switch (modelAction.actionType) {
    case "initModel": {
      // Copy from loading to current
      state.current = { ...state.loading };
      state.loading = {};
      state.status.initialLoadDone = true;
      break;
    }
    case "resetModel":
    case "resetData": {
      // Clear current state
      state.current = {};
      break;
    }
    case "commit": {
      // Commit is handled at the UndoRedoStore level
      break;
    }
    case "rollback": {
      // Copy from loading to current (same as Redux implementation)
      state.current = {
        ...state.current,
        ...state.loading
      };
      state.loading = {};
      state.status = {
        initialLoadDone: true
      };
      break;
    }
    case "createEntity": {
      // Initialize entity adapter for new entities
      if (modelAction.payload.entities) {
        for (const entityEntry of modelAction.payload.entities) {
          initializeLocalCacheSliceState(
            deploymentUuid,
            "model",
            entityEntry.entityDefinition.entityUuid,
            "current",
            state
          );
        }
      }
      break;
    }
    case "dropEntity": {
      // Remove entity from cache
      if (modelAction.payload.entityUuid) {
        const modelIndex = getReduxDeploymentsStateIndex(
          deploymentUuid,
          "model",
          modelAction.payload.entityUuid
        );
        const dataIndex = getReduxDeploymentsStateIndex(
          deploymentUuid,
          "data",
          modelAction.payload.entityUuid
        );
        delete state.current[modelIndex];
        delete state.current[dataIndex];
      }
      break;
    }
    default: {
      log.debug("handleModelAction unhandled action type", modelAction.actionType);
    }
  }
}
