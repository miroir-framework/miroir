import {
  EntityAdapter,
  PayloadAction,
  Slice,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
// const { memoize: _memoize } = lodash;

import {
  ACTION_OK,
  Action2Error,
  Action2ReturnType,
  ApplicationSection,
  ApplicationVersion,
  DeploymentEntityState,
  DomainState,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  EntityInstancesUuidIndex,
  InstanceAction,
  JzodSchema,
  LocalCacheAction,
  LoggerInterface,
  Menu,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  ModelAction,
  ModelEntityActionTransformer,
  Report,
  StoreBasedConfiguration,
  Uuid,
  adminConfigurationDeploymentMiroir,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entitySelfApplicationVersion,
  entityStoreBasedConfiguration,
  getDeploymentEntityStateIndex,
  getLocalCacheIndexDeploymentSection,
  getLocalCacheIndexDeploymentUuid,
  getLocalCacheIndexEntityUuid
} from "miroir-core";

import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  LocalCacheSliceState,
  LocalCacheSliceStateZone,
  localCacheSliceInputActionNames,
  localCacheSliceInputActionNamesObject,
  localCacheSliceName
} from "./localCacheReduxSliceInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSlice")
).then((logger: LoggerInterface) => {log = logger});



//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export function getPersistenceActionReduxEventNames(promiseActionNames: string[]): string[] {
  return promiseActionNames.reduce((acc: string[], curr) => acc.concat([curr, "saga-" + curr, curr + "/rejected"]), []);
}

export const localCacheSliceGeneratedActionNames = getPersistenceActionReduxEventNames(localCacheSliceInputActionNames);



//#########################################################################################
export function getLocalCacheKeysForDeploymentUuid(localCacheKeys:string[], deploymentUuid: Uuid): string[] {
  return localCacheKeys.filter(k=>k.match(new RegExp(`^${deploymentUuid}_`)))
}

//#########################################################################################
export function getLocalCacheKeysForDeploymentSection(localCacheKeys:string[], section: string): string[] {
  return localCacheKeys.filter(k=>k.match(new RegExp(`_${section}_`)))
}

//#########################################################################################
export function getDeploymentUuidListFromLocalCacheKeys(localCacheKeys:string[]): Uuid[] {
  const resultSet = new Set<Uuid>();
  localCacheKeys.forEach(k=>{const deploymentUuid = getLocalCacheIndexDeploymentUuid(k); if (deploymentUuid) resultSet.add(deploymentUuid)})
  return Array.from(resultSet.keys());
}

//#########################################################################################
export function getLocalCacheKeysDeploymentSectionList(localCacheKeys:string[],deploymentUuid:Uuid): string[] {
  const resultSet = new Set<string>();
  getLocalCacheKeysForDeploymentUuid(localCacheKeys, deploymentUuid)
  .forEach(k=>{const section = getLocalCacheIndexDeploymentSection(k); if (section) resultSet.add(section)})
  return Array.from(resultSet.keys());
}

//#########################################################################################
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
export function localCacheStateToDomainState(localCache:LocalCacheSliceState):DomainState {
  const localCacheKeys = Object.keys(localCache.current);
  const deployments = getDeploymentUuidListFromLocalCacheKeys(localCacheKeys);
  return Object.fromEntries(
    deployments.map(
      deploymentUuid=>{
        const deploymentLocalCacheKeys = getLocalCacheKeysForDeploymentUuid(localCacheKeys,deploymentUuid);
        const sections = getLocalCacheKeysDeploymentSectionList(deploymentLocalCacheKeys,deploymentUuid);
        return [
          deploymentUuid,
          Object.fromEntries(
            sections.map(
              section=> {
                const sectionLocalCacheKeys = getLocalCacheKeysForDeploymentSection(deploymentLocalCacheKeys,section)
                return [
                  section,
                  Object.fromEntries(
                    sectionLocalCacheKeys.map(
                      k=>[
                        getLocalCacheIndexEntityUuid(k),
                        localCache.current[k]?.entities  as EntityInstancesUuidIndex?? {}
                      ]
                    )
                  )
                ]
              }
            )
          )
        ]
      }
    )
  )
}

//#########################################################################################
export function selectDomainStateFromlocalCacheEntityZone(localCacheEntityZone:DeploymentEntityState):DomainState {
  const localCacheKeys = Object.keys(localCacheEntityZone);
  const deployments = getDeploymentUuidListFromLocalCacheKeys(localCacheKeys);
  return Object.fromEntries(
    deployments.map(
      deploymentUuid=>{
        const deploymentLocalCacheKeys = getLocalCacheKeysForDeploymentUuid(localCacheKeys,deploymentUuid);
        const sections = getLocalCacheKeysDeploymentSectionList(deploymentLocalCacheKeys,deploymentUuid);
        return [
          deploymentUuid,
          Object.fromEntries(
            sections.map(
              section=> {
                const sectionLocalCacheKeys: string[] = getLocalCacheKeysForDeploymentSection(deploymentLocalCacheKeys,section)
                return [
                  section,
                  Object.fromEntries(
                    sectionLocalCacheKeys.map(
                      (k: string)=>[
                        getLocalCacheIndexEntityUuid(k),
                        localCacheEntityZone[k]?.entities  as EntityInstancesUuidIndex?? {}
                      ]
                    )
                  )
                ]
              }
            )
          )
        ]
      }
    )
  )
}

//#########################################################################################
export function currentModel(deploymentUuid: string, state:LocalCacheSliceState): MetaModel {
  // log.info(
  //   "called currentModel(",
  //   deploymentUuid,
  //   ") from state:",
  //   Object.keys(state)
  // );

  if (!deploymentUuid) {
    throw new Error("currentModel(deploymentUuid) parameter can not be undefined.");
  } else {
      const metaModelSection = "model";
      const modelSection = deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model";
      const applicationVersions = state.current[getDeploymentEntityStateIndex(deploymentUuid, modelSection, entitySelfApplicationVersion.uuid)];
      const configuration = state.current[getDeploymentEntityStateIndex(deploymentUuid, modelSection, entityStoreBasedConfiguration.uuid)];
      const entities = state.current[getDeploymentEntityStateIndex(deploymentUuid, metaModelSection, entityEntity.uuid)];
      const entityDefinitions = state.current[getDeploymentEntityStateIndex(deploymentUuid, metaModelSection, entityEntityDefinition.uuid)];
      const jzodSchemas = state.current[getDeploymentEntityStateIndex(deploymentUuid, modelSection, entityJzodSchema.uuid)];
      const menus = state.current[getDeploymentEntityStateIndex(deploymentUuid, modelSection, entityMenu.uuid)];
      const reports = state.current[getDeploymentEntityStateIndex(deploymentUuid, modelSection, entityReport.uuid)];
      const result = {
        applicationVersions: (applicationVersions && applicationVersions.entities
          ? Object.values(applicationVersions.entities)
          : []) as ApplicationVersion[],
        applicationVersionCrossEntityDefinition: [],
        configuration: (configuration && configuration.entities
          ? Object.values(configuration.entities)
          : []) as StoreBasedConfiguration[],
        entities: (entities && entities.entities? Object.values(entities.entities):[]) as MetaEntity[],
        entityDefinitions: (entityDefinitions && entityDefinitions.entities? Object.values(entityDefinitions.entities):[]) as EntityDefinition[],
        jzodSchemas: (jzodSchemas && jzodSchemas.entities? Object.values(jzodSchemas.entities): []) as JzodSchema[],
        menus: (menus && menus.entities? Object.values(menus.entities): []) as Menu[],
        reports: (reports && reports.entities? Object.values(reports.entities):[]) as Report[],
      }
      // log.info("called currentModel(", deploymentUuid, ") found result:", JSON.stringify(result, null, 2));
      return result;
  }
}

//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
// IMPLEMENTATION
//#########################################################################################
const entityAdapter: EntityAdapter<EntityInstance, string> = createEntityAdapter<EntityInstance, string>({
  // Assume IDs are stored in a field other than `book.id`
  selectId: (entity) => entity.uuid,
  // Keep the "all IDs" array sorted based on book titles
  // sortComparer: (a, b) => a.name.localeCompare(b.name),
});

//#########################################################################################
// DOES SIDE EFFECT ON STATE!!!!!!!!!!!!
function initializeLocalCacheSliceStateWithEntityAdapter(
  deploymentUuid: string,
  section: ApplicationSection,
  entityUuid: string,
  zone: LocalCacheSliceStateZone,
  state: LocalCacheSliceState
) {
  // TODO: refactor so as to avoid side effects!
  const entityInstancesLocationIndex = getDeploymentEntityStateIndex(deploymentUuid, section, entityUuid);
  // log.info(
  //   "getInitializedSectionEntityAdapter called",
  //   "deploymentUuid",
  //   deploymentUuid,
  //   "section",
  //   section,
  //   "entityUuid",
  //   entityUuid,
  //   "index",
  //   entityInstancesLocationIndex
  // );
  // const sliceEntityAdapter = getLocalCacheSliceEntityAdapter();
  if (!(state as any)[zone][entityInstancesLocationIndex]) {
    (state as any)[zone][entityInstancesLocationIndex] = entityAdapter.getInitialState();
    log.warn(
      "getInitializedSectionEntityAdapter state[",
      zone,
      "][",
      entityInstancesLocationIndex,
      "] is undefined! setting value",
      JSON.stringify((state as any)[zone][entityInstancesLocationIndex])
    );
  }
  // }
  // log.debug(
  //   "LocalCacheSlice getInitializedSectionEntityAdapter done",
  //   "deploymentUuid",
  //   deploymentUuid,
  //   "section",
  //   section,
  //   "entityUuid",
  //   entityUuid,
  //   "result",
  //   sliceEntityAdapter
  // );
  return entityAdapter;
}

//#########################################################################################
//# REDUCER FUNCTION
//#########################################################################################
function equalEntityInstances(newOnes:EntityInstance[],oldOnes:Record<string, EntityInstance>) {
  for (const newOne of newOnes) {
    if (!oldOnes[newOne.uuid] || !equal(newOne,oldOnes[newOne.uuid])) {
      return false;
    }
  }
  return true;
}

// ################################################################################################
function loadNewEntityInstancesInLocalCache(
  deploymentUuid: string,
  section: ApplicationSection,
  state: LocalCacheSliceState,
  instanceCollection: EntityInstanceCollection
) {
  // log.info(
  //   "loadNewEntityInstancesInLocalCache called with deployment",
  //   deploymentUuid,
  //   "section",
  //   section,
  //   "instanceCollection",
  //   instanceCollection
  // );
  const instanceCollectionEntityIndex = getDeploymentEntityStateIndex(deploymentUuid, section, instanceCollection.parentUuid);
  // log.info(
  //   "ReplaceInstancesForDeploymentEntity for deployment",
  //   deploymentUuid,
  //   "section",
  //   section,
  //   "instanceCollection",
  //   instanceCollection,
  //   // "entity",
  //   // entity ? (entity as any)["name"] : "entity not found for deployment"
  // );
  const sliceEntityAdapter = initializeLocalCacheSliceStateWithEntityAdapter(
    deploymentUuid,
    section,
    instanceCollection.parentUuid,
    "loading",
    state
  );

  // gets rid of most warnings: "A non-serializable value was detected in the state"
  const serializableInstances = instanceCollection.instances.map((i: EntityInstance) =>
    (i as any)["createdAt"]
      ? {
          ...i,
          createdAt: new Date((i as any)["createdAt"]).getTime(), // for instances tha are stored in a postgres database. What about other date attributes?
          updatedAt: new Date((i as any)["updatedAt"]).getTime(),
        }
      : i
  );

  // log.info(
  //   "loadNewEntityInstancesInLocalCache loading instances",
  //   deploymentUuid,
  //   section,
  //   JSON.stringify(serializableInstances[0])
  // );

  (state as any).loading[instanceCollectionEntityIndex] = sliceEntityAdapter.setAll(
    (state as any).loading[instanceCollectionEntityIndex],
    // instanceCollection.instances
    serializableInstances
  );
  // log.info("loadNewInstancesInLocalCache returned state", JSON.stringify(state))
}

//#########################################################################################
// 
function handleInstanceAction(
  state: LocalCacheSliceState,
  instanceAction: InstanceAction
): Action2ReturnType {
  // log.info(
  //   "localCacheSliceObject handleInstanceAction deploymentUuid",
  //   instanceAction.deploymentUuid,
  //   "actionName",
  //   instanceAction.actionName,
  //   "called",
  //   // JSON.stringify(action, null, 2)
  //   instanceAction
  // );
  try {
    // switch (instanceAction.actionName) {
    switch (instanceAction.actionType) {
    case "createInstance": {
      for (let instanceCollection of instanceAction.payload.objects ?? ([] as EntityInstanceCollection[])) {
        const instanceCollectionEntityIndex = getDeploymentEntityStateIndex(
          instanceAction.deploymentUuid,
          instanceAction.payload.applicationSection,
          instanceCollection.parentUuid
        );
        log.debug(
          "create for entity",
          instanceCollection.parentName,
          instanceCollection.parentUuid,
          "instances",
          JSON.stringify(instanceCollection.instances, null, 2)
          // JSON.stringify(state)
        );

        const sliceEntityAdapter:EntityAdapter<EntityInstance, string> = initializeLocalCacheSliceStateWithEntityAdapter(
          instanceAction.deploymentUuid,
          instanceAction.payload.applicationSection,
          instanceCollection.parentUuid,
          "current",
          state
        );

        // log.info('localCacheSliceObject handleInstanceAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state before insert',JSON.stringify(state));

        sliceEntityAdapter.addMany(state.current[instanceCollectionEntityIndex], instanceCollection.instances);

        // log.info('localCacheSliceObject handleInstanceAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state after insert',JSON.stringify(state));

        if (instanceCollection.parentUuid == entityDefinitionEntityDefinition.uuid) {
          // TODO: does it work? How?
          // log.info('localCacheSliceObject handleInstanceAction creating entityAdapter for Entities',instanceCollection.instances.map((i:EntityInstanceWithName)=>i['name']));

          instanceCollection.instances.forEach((i: EntityInstance) =>
            initializeLocalCacheSliceStateWithEntityAdapter(
              instanceAction.deploymentUuid,
              instanceAction.payload.applicationSection,
              i["uuid"],
              "current",
              state
            )
          );
        }
        log.info('create done',JSON.stringify(state.current[instanceCollectionEntityIndex], null, 2));
      }
      break;
    }
    case "deleteInstance": {
      for (let instanceCollection of instanceAction.payload.objects) {
        try {
          log.debug(
            "localCacheSliceObject handleInstanceAction delete called for instanceCollection",
            instanceCollection
          );

          const instanceCollectionEntityIndex = getDeploymentEntityStateIndex(
            instanceAction.deploymentUuid,
            instanceAction.payload.applicationSection,
            instanceCollection.parentUuid
          );

          // log.debug(
          //   "localCacheSliceObject handleInstanceAction delete received instanceCollectionEntityIndex",
          //   instanceCollectionEntityIndex
          // );

          const sliceEntityAdapter = initializeLocalCacheSliceStateWithEntityAdapter(
            instanceAction.deploymentUuid,
            instanceAction.payload.applicationSection,
            instanceCollection.parentUuid,
            "current",
            state
          );
          // log.trace(
          //   "localCacheSliceObject handleInstanceAction delete received sliceEntityAdapter",
          //   sliceEntityAdapter,
          //   "for instanceCollection",
          //   instanceCollection,
          //   "state",
          //   JSON.stringify(state[instanceCollectionEntityIndex])
          // );

          sliceEntityAdapter.removeMany(
            state.current[instanceCollectionEntityIndex],
            instanceCollection.instances.map((i:EntityInstance) => i.uuid)
          );
          log.info(
            "localCacheSliceObject handleInstanceAction delete state after removeMany for instanceCollection",
            instanceCollection,
            "state",
            JSON.stringify(state.current[instanceCollectionEntityIndex])
          );
        } catch (error) {
          log.error(
            "localCacheSliceObject handleInstanceAction delete for instanceCollection",
            instanceCollection,
            "received error",
            error
          );
        }
      }
      break;
    }
    case "updateInstance": {
      for (let instanceCollection of instanceAction.payload.objects) {
        const instanceCollectionEntityIndex = getDeploymentEntityStateIndex(
          instanceAction.deploymentUuid,
          instanceAction.payload.applicationSection,
          instanceCollection.parentUuid
        );
        const sliceEntityAdapter = initializeLocalCacheSliceStateWithEntityAdapter(
          instanceAction.deploymentUuid,
          instanceAction.payload.applicationSection,
          instanceCollection.parentUuid,
          "current",
          state
        );
        // log.info("localCacheSliceObject handleInstanceAction for index", instanceCollectionEntityIndex, sliceEntityAdapter)
        const updates = instanceCollection.instances.map((i:EntityInstance) => ({ id: i.uuid, changes: i }));
        // log.info("localCacheSliceObject handleInstanceAction for entity", instanceCollection.parentUuid, instanceCollection.parentUuid, "updating", updates)
        sliceEntityAdapter.updateMany(
          state.current[instanceCollectionEntityIndex],
          updates,
        );
      }
      break;
    }
    case "loadNewInstancesInLocalCache": {
      // log.info("localCacheSlice handleInstanceAction loadNewInstancesInLocalCache called!");
      for (const instanceCollection of instanceAction.payload.objects) {
        loadNewEntityInstancesInLocalCache(
          instanceAction.deploymentUuid,
          instanceCollection.applicationSection,
          state,
          instanceCollection
        );
      }
      break;
    }
    default:
      log.warn(
        "localCacheSliceObject handleInstanceAction action could not be taken into account, unkown action",
        instanceAction
      );
  }
} catch (error) {
    log.error(
      "localCacheSliceObject handleInstanceAction action could not be taken into account, error",
      instanceAction,
      // JSON.stringify(instanceAction, undefined, 2),
      error
    );
    return new Action2Error(
      "FailedToHandleAction",
      "localCacheSliceObject handleInstanceAction action could not be taken into account, error" + JSON.stringify(instanceAction),
      ["handleInstanceAction"],
      error as any
    );
  }
return ACTION_OK
}


//#########################################################################################
function handleModelAction(
  state: LocalCacheSliceState,
  deploymentUuid: Uuid,
  action: ModelAction
): Action2ReturnType {
  log.info(
    "localCacheSliceObject handleModelAction called",
    action.actionType,
    "deploymentUuid",
    deploymentUuid,
    "action",
    action, 
  );
  // TODO: fail in case of Transactional Entity (Entity, EntityDefinition...)?
  // switch (action.actionType) {
  //   case "modelAction": {
  // switch (action.actionName) {
  switch (action.actionType) {
    case "rollback": {
      // TODO: DIRTY, DIRTY, DIRTY...
      state.current = {
        // can not REMOVE stuff from state this way!
        ...state.current,
        ...state.loading
      };
      state.loading = {};
      state.status = {
        initialLoadDone: true
      };
      // log.info(
      //   "localCacheSliceObject handleModelAction done!",
      //   action.actionName,
      //   "state",
      //   JSON.stringify(state)
      // );
      break;
    }
    case "initModel":
    case "commit":
    case "remoteLocalCacheRollback":
    case "resetModel":
    case "resetData":
    case "alterEntityAttribute":
    case "renameEntity":
    case "createEntity":
    case "dropEntity": {
      const localInstanceActions =
        ModelEntityActionTransformer.modelActionToInstanceAction(
          action.deploymentUuid,
          action,
          currentModel(action.deploymentUuid, state)
        );
    
      for (const localInstanceAction of localInstanceActions) {
        handleInstanceAction(state, localInstanceAction);
      }
      break;
    }
    default:
      break;
  }
      // break;
    // }
    // default: {
    //   log.warn("localCacheSliceObject handleDomainEntityAction could not handle action:", JSON.stringify(action, undefined, 2))
    //   break;
    // }
  // }
  return ACTION_OK;
}

// //#########################################################################################
// function handleEndpointAction(
//   state: LocalCacheSliceState,
//   action: InstanceAction
// ): Action2ReturnType {
//   // log.info(
//   //   "localCacheSliceObject handleEndpointAction called",
//   //   action.actionName,
//   //   "deploymentUuid",
//   //   deploymentUuid,
//   //   "action",
//   //   action
//   // );
//   switch (action.actionType) {
//     case "instanceAction": {
//       return handleInstanceAction(state, action);
//       break;
//     }
//     default: {
//       log.warn("localCacheSliceObject handleDomainEntityAction could not handle action:", JSON.stringify(action, undefined, 2))
//       break;
//     }
//   }
//   return ACTION_OK;
// }

//#########################################################################################
function handleAction(
  state: LocalCacheSliceState,
  action: LocalCacheAction
): Action2ReturnType {
  // log.info(
  //   "localCacheSliceObject handleAction called",
  //   action.actionType,
  //   "deploymentUuid",
  //   action.actionType !== "transactionalInstanceAction" ?action.deploymentUuid:action.instanceAction.deploymentUuid,
  //   "action",
  //   // JSON.stringify(action, undefined, 2)
  //   action
  // );
  switch (action.actionType) {
    case "undoRedoAction": {
      // log.debug(
      //   "localCacheSliceObject handleUndoRedoAction deploymentUuid",
      //   action.deploymentUuid,
      //   "action has no effect",
      //   JSON.stringify(action, undefined, 2)
      // );
      break;
    }
    // case "modelAction": 
    case "initModel":
    case "commit":
    case "rollback":
    case "remoteLocalCacheRollback":
    case "resetModel":
    case "resetData":
    case "alterEntityAttribute":
    case "renameEntity":
    case "createEntity":
    case "dropEntity":
    {
      return handleModelAction(state, action.deploymentUuid,action);
      break;
    }
    case "transactionalInstanceAction": {
      return handleInstanceAction(state, action.instanceAction);
      break;
    }
    // case "instanceAction": {
    case "createInstance":
    case "deleteInstance":
    case "deleteInstanceWithCascade":
    case "updateInstance":
    case "loadNewInstancesInLocalCache":
    case "getInstance":
    case "getInstances": {
      return handleInstanceAction(state, action);
      break;
    }
    default: {
      log.warn("localCacheSliceObject handleDomainEntityAction could not handle action:", JSON.stringify(action, undefined, 2))
      break;
    }
  }
  return ACTION_OK;
}

function actionReturnTypeToException(a:Action2ReturnType) {
  if (a instanceof Action2Error) {
    throw new Error("caught error on return value " + JSON.stringify(a, undefined, 2));
  }
}

//#########################################################################################
//# SLICE
//#########################################################################################
export const localCacheSliceObject: Slice<LocalCacheSliceState> = createSlice({
  name: localCacheSliceName,
  initialState: { loading: {}, current: {}, status: { initialLoadDone: false } } as LocalCacheSliceState,
  reducers: {
    [localCacheSliceInputActionNamesObject.handleAction](
      state: LocalCacheSliceState,
      action: PayloadAction<LocalCacheAction>
    ): void {
      actionReturnTypeToException(handleAction(state, action.payload));
    },
  },
});

//#########################################################################################
//# SLICE OBJECT
//#########################################################################################
export const LocalCacheSlice = {
  reducer: localCacheSliceObject.reducer,
  actionCreators: {...localCacheSliceObject.actions},
  inputActionNames: localCacheSliceInputActionNamesObject,
};


export default {};
