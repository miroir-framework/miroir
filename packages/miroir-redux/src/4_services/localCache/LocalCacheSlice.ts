import {
  ActionCreatorWithPayload,
  Dictionary,
  EntityAdapter,
  PayloadAction,
  Slice,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import { memoize as _memoize } from "lodash";
import {
  ApplicationSection,
  DomainAction,
  DomainActionWithDeployment,
  DomainDataAction,
  DomainState,
  DomainTransactionalAction,
  DomainTransactionalReplaceLocalCacheAction,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  EntityInstancesUuidIndex,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  ModelEntityUpdateConverter,
  Uuid,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition
} from "miroir-core";
import {
  LocalCacheSliceState,
  localCacheSliceInputActionNames,
  localCacheSliceInputActionNamesObject,
  localCacheSliceName
} from "./localCacheInterface";

const loggerName: string = "4_miroir-redux_LocalCacheSlice";
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export function getPromiseActionStoreActionNames(promiseActionNames: string[]): string[] {
  return promiseActionNames.reduce((acc: string[], curr) => acc.concat([curr, "saga-" + curr, curr + "/rejected"]), []);
}

export const localCacheSliceGeneratedActionNames = getPromiseActionStoreActionNames(localCacheSliceInputActionNames);


//#########################################################################################
export function getLocalCacheSliceIndex(
  deploymentUuid: Uuid | undefined,
  applicationSection: ApplicationSection | undefined,
  entityUuid: Uuid | undefined
): string {
  return "" + deploymentUuid + "_" + applicationSection + "_" + entityUuid;
}

//#########################################################################################
export function getLocalCacheIndexEntityUuid(localCacheIndex:string): Uuid {
  const entityUuid = new RegExp(/\_([0-9a-fA-F\-]+)$/).exec(localCacheIndex)
  if (entityUuid) {
    // log.info('found entityUuid',entityUuid);
    return entityUuid[1];
  } else {
    throw new Error("unknown entity in local cache index: " + localCacheIndex);
  }
}
//#########################################################################################
export function getLocalCacheIndexDeploymentUuid(localCacheIndex:string): Uuid {
  const deploymentUuid = new RegExp(/^([0-9a-fA-F\-]+)\_/).exec(localCacheIndex)
  if (deploymentUuid) {
    // log.info('found deploymentUuid',deploymentUuid);
    return deploymentUuid[1];
  } else {
    throw new Error("unknown deployment in local cache index: " + localCacheIndex);
  }
}
//#########################################################################################
export function getLocalCacheIndexDeploymentSection(localCacheIndex:string): Uuid {
  const deploymentSection = new RegExp(/^[0-9a-fA-F\-]+_([^_]+)_[0-9a-fA-F\-]+$/).exec(localCacheIndex)
  if (deploymentSection) {
    // log.info('getLocalCacheIndexDeploymentSection found deploymentSection',deploymentSection);
    return deploymentSection[1];
  } else {
    throw new Error("getLocalCacheIndexDeploymentSection unknown deployment section in local cache index: " + localCacheIndex + ' found deploymentSection is undefined');
  }
  // return deploymentSection?deploymentSection[1]:undefined;
}

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
  const localCacheKeys = Object.keys(localCache);
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
                        localCache[k]?.entities  as EntityInstancesUuidIndex?? {}
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
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
// IMPLEMENTATION
//#########################################################################################
const getLocalCacheSliceEntityAdapter: (entityUuid: string) => EntityAdapter<EntityInstance> = _memoize(
  (entityUuid: string) => {
    // log.info("getEntityAdapter creating EntityAdapter For entity", parentName);
    const result: EntityAdapter<EntityInstance> = createEntityAdapter<EntityInstance>({
      // Assume IDs are stored in a field other than `book.id`
      selectId: (entity) => entity.uuid,
      // Keep the "all IDs" array sorted based on book titles
      // sortComparer: (a, b) => a.name.localeCompare(b.name),
    });

    // log.info("getEntityAdapter creating EntityAdapter For entity", entityUuid, "result", result);

    return result;
  }
);

//#########################################################################################
// DOES SIDE EFFECT ON STATE!!!!!!!!!!!!
function getInitializedSectionEntityAdapter(
  deploymentUuid: string,
  section: ApplicationSection,
  entityUuid: string,
  state: LocalCacheSliceState
) {
  // TODO: refactor so as to avoid side effects!
  const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(entityUuid);
  const index = getLocalCacheSliceIndex(deploymentUuid, section, entityUuid);
  if (!state) {
    // log.info('getInitializedDeploymentEntityAdapter state is undefined, initializing state!',JSON.stringify(state),state == undefined);
    state = { [index]: sliceEntityAdapter.getInitialState() } as LocalCacheSliceState;
  } else {
    if (!state[index]) {
      state[index] = sliceEntityAdapter.getInitialState();
    }
  }
  // log.info(
  //   "LocalCacheSlice getInitializedDeploymentEntityAdapter",
  //   "deploymentUuid",
  //   deploymentUuid,
  //   "section",
  //   section,
  //   "entityUuid",
  //   entityUuid,
  //   "state",
  //   JSON.stringify(state)
  // );
  return sliceEntityAdapter;
}

//#########################################################################################
//# REDUCER FUNCTION
//#########################################################################################
// function ReplaceInstancesForDeploymentEntity(deploymentUuid: string, state: LocalCacheSliceState, action: PayloadAction<EntityInstanceCollection>) {
// function equalEntityInstances(newOnes:EntityInstance[],oldOnes:{[k:string]:EntityInstance}) {
function equalEntityInstances(newOnes:EntityInstance[],oldOnes:Dictionary<EntityInstance>) {
  for (const newOne of newOnes) {
    if (!oldOnes[newOne.uuid] || !equal(newOne,oldOnes[newOne.uuid])) {
      return false;
    }
  }
  return true;
}
// ################################################################################################
function ReplaceInstancesForSectionEntity(
  deploymentUuid: string,
  section: ApplicationSection,
  state: LocalCacheSliceState,
  instanceCollection: EntityInstanceCollection
) {
  // log.info('ReplaceInstancesForSectionEntity',deploymentUuid,section,instanceCollection);
  const entityEntityIndex = getLocalCacheSliceIndex(deploymentUuid, "model", entityEntity.uuid);
  const instanceCollectionEntityIndex = getLocalCacheSliceIndex(deploymentUuid, section, instanceCollection.parentUuid);
  const entity = state[entityEntityIndex]?.entities[instanceCollection.parentUuid];
  // log.info(
  //   "ReplaceInstancesForDeploymentEntity for deployment",
  //   deploymentUuid,
  //   "entity",
  //   entity ? (entity as any)["name"] : "entity not found for deployment"
  // );
  const sliceEntityAdapter = getInitializedSectionEntityAdapter(
    deploymentUuid,
    section,
    instanceCollection.parentUuid,
    state
  );

  if (Object.keys(instanceCollection.instances).length > 0 && equalEntityInstances(instanceCollection.instances,state[instanceCollectionEntityIndex].entities)) {
    log.info(
      "ReplaceInstancesForDeploymentEntity for deployment",
      deploymentUuid,
      "entity",
      entity ? (entity as any)["name"] : instanceCollection.parentName?instanceCollection.parentName:"unknown",
      "uuid",
      instanceCollection.parentUuid,
      "nothing to be done, instances did not change."
    );
  } else {
    console.debug(
      "ReplaceInstancesForDeploymentEntity for deployment",
      deploymentUuid,
      "entity",
      entity ? (entity as any)["name"] : instanceCollection.parentName?instanceCollection.parentName:"unknown",
      "uuid",
      instanceCollection.parentUuid,
      "new values",
      instanceCollection.instances,
      "differ from old values.",
      // state[instanceCollectionEntityIndex].entities
    );

    state[instanceCollectionEntityIndex] = sliceEntityAdapter.setAll(
      state[instanceCollectionEntityIndex],
      instanceCollection.instances
    );
  }
  // log.info('ReplaceInstancesForDeploymentEntity for deployment',deploymentUuid, 'entity',action.payload.parentUuid,action.payload.parentName);
}

//#########################################################################################
function handleLocalCacheNonTransactionalAction(
  state: LocalCacheSliceState,
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  action: DomainDataAction
) {
  // const deploymentUuid = applicationDeploymentMiroir.uuid
  log.info(
    "localCacheSliceObject handleLocalCacheNonTransactionalAction called",
    "deploymentUuid",
    deploymentUuid,
    "applicationSection",
    applicationSection,
    "action",
    action
  );

  switch (action.actionName) {
    case "create": {
      for (let instanceCollection of action.objects) {
        const instanceCollectionEntityIndex = getLocalCacheSliceIndex(
          deploymentUuid,
          applicationSection,
          instanceCollection.parentUuid
        );
        // log.info('create for entity',instanceCollection.parentName, instanceCollection.parentUuid, 'instances', instanceCollection.instances, JSON.stringify(state));

        const sliceEntityAdapter = getInitializedSectionEntityAdapter(
          deploymentUuid,
          applicationSection,
          instanceCollection.parentUuid,
          state
        );

        // log.info('localCacheSliceObject handleLocalCacheNonTransactionalAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state before insert',JSON.stringify(state));

        sliceEntityAdapter.addMany(state[instanceCollectionEntityIndex], instanceCollection.instances);

        // log.info('localCacheSliceObject handleLocalCacheNonTransactionalAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state after insert',JSON.stringify(state));

        if (instanceCollection.parentUuid == entityDefinitionEntityDefinition.uuid) {
          // TODO: does it work? How?
          // log.info('localCacheSliceObject handleLocalCacheNonTransactionalAction creating entityAdapter for Entities',instanceCollection.instances.map((i:EntityInstanceWithName)=>i['name']));

          instanceCollection.instances.forEach((i:EntityInstance) =>
            getInitializedSectionEntityAdapter(deploymentUuid, applicationSection, i["uuid"], state)
          );
        }
        // log.info('create done',JSON.stringify(state[deploymentUuid][applicationSection]));
      }
      break;
    }
    case "delete": {
      for (let instanceCollection of action.objects) {
        const instanceCollectionEntityIndex = getLocalCacheSliceIndex(
          deploymentUuid,
          applicationSection,
          instanceCollection.parentUuid
        );
        // log.info('localCacheSliceObject handleLocalCacheNonTransactionalAction delete', instanceCollection);

        const sliceEntityAdapter = getInitializedSectionEntityAdapter(
          deploymentUuid,
          applicationSection,
          instanceCollection.parentUuid,
          state
        );
        // log.info('localCacheSliceObject handleLocalCacheNonTransactionalAction delete state before',JSON.stringify(state[deploymentUuid][applicationSection][instanceCollection.parentUuid]));

        sliceEntityAdapter.removeMany(
          state[instanceCollectionEntityIndex],
          instanceCollection.instances.map((i) => i.uuid)
        );
        // sliceEntityAdapter.removeMany(state[deploymentUuid][applicationSection][instanceCollection.parentUuid], instanceCollection.instances.map(i => i.uuid));
        log.info(
          "localCacheSliceObject handleLocalCacheNonTransactionalAction delete state after",
          JSON.stringify(state[instanceCollectionEntityIndex])
        );
      }
      break;
    }
    case "update": {
      for (let instanceCollection of action.objects) {
        const instanceCollectionEntityIndex = getLocalCacheSliceIndex(
          deploymentUuid,
          applicationSection,
          instanceCollection.parentUuid
        );
        const sliceEntityAdapter = getInitializedSectionEntityAdapter(
          deploymentUuid,
          applicationSection,
          instanceCollection.parentUuid,
          state
        );
        sliceEntityAdapter.updateMany(
          state[instanceCollectionEntityIndex],
          instanceCollection.instances.map((i) => ({ id: i.uuid, changes: i }))
        );
      }
      break;
    }
    default:
      log.warn(
        "localCacheSliceObject handleLocalCacheNonTransactionalAction action could not be taken into account, unkown action",
        action.actionName
      );
  }
}

//#########################################################################################
function handleLocalCacheModelAction(
  state: LocalCacheSliceState,
  deploymentUuid: Uuid,
  action: DomainTransactionalAction
) {
  // log.info(
  //   "localCacheSliceObject handleLocalCacheModelAction called",
  //   action.actionName,
  //   "deploymentUuid",
  //   deploymentUuid,
  //   "action",
  //   action
  // );
  switch (action.actionName) {
    case "replaceLocalCache": {
      const castAction: DomainTransactionalReplaceLocalCacheAction = action;
      // log.info("localCacheSliceObject replaceLocalCache", deploymentUuid, action);

      for (const instanceCollection of action.objects) {
        ReplaceInstancesForSectionEntity(
          deploymentUuid,
          instanceCollection.applicationSection,
          state,
          instanceCollection
        );
      }
      break;
    }
    case "commit": {
      // reset transation contents
      // send ModelEntityUpdates to server for execution?
      // for (let instanceCollection of action.payload.objects) {
      //   ReplaceInstancesForEntity(state, { type: "ReplaceInstancesForEntity", payload: instanceCollection } as PayloadAction<EntityInstanceCollection>);
      // }
      break;
    }
    case "UpdateMetaModelInstance": {
      // not transactional??
      // log.info('localCacheSliceObject handleLocalCacheModelAction deploymentUuid',deploymentUuid,'UpdateMetaModelInstance',action);
      const domainDataAction: DomainDataAction = {
        actionType: "DomainDataAction",
        actionName: action.update.updateActionName,
        objects: action.update.objects,
      };
      // log.info("localCacheSliceObject handleLocalCacheModelAction updateModel domainDataAction", domainDataAction);

      // TODO: handle object instanceCollections by ApplicationSection
      handleLocalCacheNonTransactionalAction(
        state,
        deploymentUuid,
        domainDataAction.objects[0].applicationSection,
        domainDataAction
      );
      break;
    }
    case "updateEntity": {
      // infer from ModelEntityUpdates the CUD actions to be performed on model Entities, Reports, etc.
      // send CUD actions to local cache
      // have undo / redo contain both(?) local cache CUD actions and ModelEntityUpdates
      const entityEntityIndex = getLocalCacheSliceIndex(deploymentUuid, "model", entityEntity.uuid);
      const entityEntityDefinitionIndex = getLocalCacheSliceIndex(deploymentUuid, "model", entityEntityDefinition.uuid);

      const domainDataAction: DomainDataAction = ModelEntityUpdateConverter.modelEntityUpdateToLocalCacheUpdate(
        Object.values(state[entityEntityIndex].entities) as MetaEntity[],
        Object.values(state[entityEntityDefinitionIndex].entities) as EntityDefinition[],
        // Object.values(state[deploymentUuid]['model'][entityEntity.uuid].entities) as MetaEntity[],
        // Object.values(state[deploymentUuid]['model'][entityEntityDefinition.uuid].entities) as EntityDefinition[],
        action.update.modelEntityUpdate
      );
      // log.info(
      //   "localCacheSliceObject handleLocalCacheModelAction updateModel deploymentUuid",
      //   deploymentUuid,
      //   "domainDataAction",
      //   domainDataAction
      // );

      handleLocalCacheNonTransactionalAction(state, deploymentUuid, "model", domainDataAction);
      break;
    }
    default:
      log.warn(
        "localCacheSliceObject handleLocalCacheModelAction deploymentUuid",
        deploymentUuid,
        "action could not be taken into account, unkown action",
        action.actionName
      );
  }
}

//#########################################################################################
function handleLocalCacheAction(state: LocalCacheSliceState, deploymentUuid: Uuid, action: DomainAction) {
  log.info(
    "localCacheSliceObject handleLocalCacheAction deploymentUuid",
    deploymentUuid,
    "actionType",
    action.actionType,
    "called",
    action
  );
  switch (action.actionType) {
    case "DomainDataAction": {
      handleLocalCacheNonTransactionalAction(state, deploymentUuid, "data", action);
      break;
    }
    case "DomainTransactionalAction": {
      handleLocalCacheModelAction(state, deploymentUuid, action);
      break;
    }
    default:
      log.warn(
        "localCacheSliceObject handleLocalCacheAction action could not be taken into account, unkown action",
        action
      );
  }
}

//#########################################################################################
//# SLICE
//#########################################################################################
export const localCacheSliceObject: Slice<LocalCacheSliceState> = createSlice({
  name: localCacheSliceName,
  initialState: {} as LocalCacheSliceState,
  reducers: {
    [localCacheSliceInputActionNamesObject.handleLocalCacheAction](
      state: LocalCacheSliceState,
      action: PayloadAction<DomainActionWithDeployment>
    ) {
      handleLocalCacheAction(state, action.payload.deploymentUuid, action.payload.domainAction);
    },
  },
});

//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
// export const mInstanceSliceActionsCreators:{[actionCreatorName:string]:any} = {
type LocalCacheSliceActionCreator<P> = ActionCreatorWithPayload<P, `${string}/${string}`>;

const actionsCreators: {
  [actionCreatorName: string]: LocalCacheSliceActionCreator<any>;
} = {
  ...localCacheSliceObject.actions,
};

//#########################################################################################
//# SLICE OBJECT
//#########################################################################################
export const LocalCacheSlice = {
  reducer: localCacheSliceObject.reducer,
  actionCreators: actionsCreators,
  inputActionNames: localCacheSliceInputActionNamesObject,
};


export default {};
