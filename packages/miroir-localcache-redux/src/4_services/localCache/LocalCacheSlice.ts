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
  ACTION_OK,
  ActionReturnType,
  ApplicationSection,
  ApplicationVersion,
  DomainState,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  EntityInstancesUuidIndex,
  InstanceAction,
  JzodSchema,
  LocalCacheTransactionalInstanceActionWithDeployment,
  LocalCacheUndoRedoAction,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  ModelAction,
  ModelEntityActionTransformer,
  Report,
  StoreBasedConfiguration,
  UndoRedoAction,
  Uuid,
  applicationDeploymentMiroir,
  entityApplicationVersion,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityReport,
  entityStoreBasedConfiguration,
  getLoggerName
} from "miroir-core";

import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import {
  LocalCacheSliceState,
  localCacheSliceInputActionNames,
  localCacheSliceInputActionNamesObject,
  localCacheSliceName
} from "./localCacheReduxSliceInterface";

const loggerName: string = getLoggerName(packageName, cleanLevel,"LocalCacheSlice");
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
export function currentModel(deploymentUuid: string, state:LocalCacheSliceState): MetaModel {
  // log.info(
  //   "called currentModel(",
  //   deploymentUuid,")"
  // );
  log.info(
    "called currentModel(",
    deploymentUuid,
    ") from state:",
    Object.keys(state)
  );
  // const reduxState = this.innerReduxStore.getState().presentModelSnapshot;

  if (!deploymentUuid) {
    throw new Error("currentModel(deploymentUuid) parameter can not be undefined.");
  } else {
    // if (deploymentUuid == applicationDeploymentMiroir.uuid) {
      const stateEntries  = Object.entries(state);
      // log.info("called currentModel(", deploymentUuid, ") stateEntries:", stateEntries);
      const metaModelSection = "model";
      const modelSection = deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model";
      const applicationVersions = state[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityApplicationVersion.uuid)];
      const configuration = state[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityStoreBasedConfiguration.uuid)];
      const entities = state[getLocalCacheSliceIndex(deploymentUuid, metaModelSection, entityEntity.uuid)];
      const entityDefinitions = state[getLocalCacheSliceIndex(deploymentUuid, metaModelSection, entityEntityDefinition.uuid)];
      const jzodSchemas = state[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityJzodSchema.uuid)];
      const reports = state[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityReport.uuid)];
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
        reports: (reports && reports.entities? Object.values(reports.entities):[]) as Report[],
      }
      // log.info("called currentModel(", deploymentUuid, ") entities:", entities, Object.values(entities.entities));
      // log.info("called currentModel(", deploymentUuid, ") entities:", entities.entities);
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
  const index = getLocalCacheSliceIndex(deploymentUuid, section, entityUuid);
  log.debug("getInitializedSectionEntityAdapter called", "deploymentUuid", deploymentUuid, "section", section, "entityUuid", entityUuid, "index", index);
  const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(entityUuid);
  if (!state) {
    log.debug('getInitializedSectionEntityAdapter state is undefined, initializing state!',JSON.stringify(state),state == undefined);
    state = { [index]: sliceEntityAdapter.getInitialState() } as LocalCacheSliceState;
  } else {
    if (!state[index]) {
      state[index] = sliceEntityAdapter.getInitialState();
      log.debug("getInitializedSectionEntityAdapter state[",index,"] is undefined! setting value",JSON.stringify(state[index]));
    }
  }
  log.debug(
    "LocalCacheSlice getInitializedSectionEntityAdapter done",
    "deploymentUuid",
    deploymentUuid,
    "section",
    section,
    "entityUuid",
    entityUuid,
    "result",
    sliceEntityAdapter
    // "state",
    // JSON.stringify(state)
  );
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
  log.debug('ReplaceInstancesForSectionEntity',deploymentUuid,section,instanceCollection);
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

  if (
    Object.keys(instanceCollection.instances).length > 0 &&
    equalEntityInstances(instanceCollection.instances, state[instanceCollectionEntityIndex].entities)
  ) {
    log.debug(
      "ReplaceInstancesForDeploymentEntity for deployment",
      deploymentUuid,
      "entity",
      entity ? (entity as any)["name"] : instanceCollection.parentName ? instanceCollection.parentName : "unknown",
      "uuid",
      instanceCollection.parentUuid,
      "nothing to be done, instances did not change."
    );
  } else {
    log.trace(
      "ReplaceInstancesForDeploymentEntity for deployment",
      deploymentUuid,
      "entity",
      entity ? (entity as any)["name"] : instanceCollection.parentName ? instanceCollection.parentName : "unknown",
      "uuid",
      instanceCollection.parentUuid,
      "new values",
      instanceCollection.instances,
      "differ from old values."
      // state[instanceCollectionEntityIndex].entities
    );

    state[instanceCollectionEntityIndex] = sliceEntityAdapter.setAll(
      state[instanceCollectionEntityIndex],
      instanceCollection.instances
    );
  }
  // log.info('ReplaceInstancesForDeploymentEntity for deployment',deploymentUuid, 'entity',action.payload.parentUuid,action.payload.parentName);
}

// //#########################################################################################
// /**
//  * Performs the effects of an action on the local state so that this local state reflects
//  * the modifications due to this action.
//  * The action is also added to the current transaction by the undoRedoReducer.
//  * @param state 
//  * @param deploymentUuid 
//  * @param action 
//  * @returns 
//  */
// function handleUndoRedoAction(
//   state: LocalCacheSliceState,
//   // action: LocalCacheUndoRedoAction
//   action: UndoRedoAction
// ): ActionReturnType {
//   // log.info(
//   //   "localCacheSliceObject handleUndoRedoAction called",
//   //   action.actionName,
//   //   "deploymentUuid",
//   //   deploymentUuid,
//   //   "action",
//   //   action
//   // );
//   switch (action.actionType) {
//     case "undoRedoAction":
//     default: {
//       switch (action.actionName) {
//         case "undo":
//         case "redo": {
//           log.warn("localCache.handleUndoRedoAction does nothing for DomainUndoRedoAction", action);
//           break;
//         }
//         default:
//           log.warn(
//             "localCacheSliceObject handleUndoRedoAction deploymentUuid",
//             action.deploymentUuid,
//             "action could not be taken into account, unkown action",
//             JSON.stringify(action, undefined, 2)
//           );
//       }
//       break;
//     }
//   }
//   return ACTION_OK;
// }

//#########################################################################################
// 
function handleInstanceAction(
  state: LocalCacheSliceState,
  instanceAction: InstanceAction
): ActionReturnType {
  log.info(
    "localCacheSliceObject handleInstanceAction deploymentUuid",
    instanceAction.deploymentUuid,
    "actionType",
    instanceAction.actionType,
    "called",
    // JSON.stringify(action, null, 2)
    instanceAction
  );
  switch (instanceAction.actionName) {
    case "createInstance": {
      for (let instanceCollection of instanceAction.objects ?? ([] as EntityInstanceCollection[])) {
        const instanceCollectionEntityIndex = getLocalCacheSliceIndex(
          instanceAction.deploymentUuid,
          instanceAction.applicationSection,
          instanceCollection.parentUuid
        );
        log.debug(
          "create for entity",
          instanceCollection.parentName,
          instanceCollection.parentUuid,
          "instances",
          instanceCollection.instances
          // JSON.stringify(state)
        );

        const sliceEntityAdapter = getInitializedSectionEntityAdapter(
          instanceAction.deploymentUuid,
          instanceAction.applicationSection,
          instanceCollection.parentUuid,
          state
        );

        // log.info('localCacheSliceObject handleInstanceAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state before insert',JSON.stringify(state));

        sliceEntityAdapter.addMany(state[instanceCollectionEntityIndex], instanceCollection.instances);

        // log.info('localCacheSliceObject handleInstanceAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state after insert',JSON.stringify(state));

        if (instanceCollection.parentUuid == entityDefinitionEntityDefinition.uuid) {
          // TODO: does it work? How?
          // log.info('localCacheSliceObject handleInstanceAction creating entityAdapter for Entities',instanceCollection.instances.map((i:EntityInstanceWithName)=>i['name']));

          instanceCollection.instances.forEach((i: EntityInstance) =>
            getInitializedSectionEntityAdapter(
              instanceAction.deploymentUuid,
              instanceAction.applicationSection,
              i["uuid"],
              state
            )
          );
        }
        // log.info('create done',JSON.stringify(state[deploymentUuid][applicationSection]));
      }
      break;
    }
    case "deleteInstance": {
      for (let instanceCollection of instanceAction.objects) {
        try {
          log.debug(
            "localCacheSliceObject handleInstanceAction delete called for instanceCollection",
            instanceCollection
          );

          const instanceCollectionEntityIndex = getLocalCacheSliceIndex(
            instanceAction.deploymentUuid,
            instanceAction.applicationSection,
            instanceCollection.parentUuid
          );

          log.debug(
            "localCacheSliceObject handleInstanceAction delete received instanceCollectionEntityIndex",
            instanceCollectionEntityIndex
          );

          const sliceEntityAdapter = getInitializedSectionEntityAdapter(
            instanceAction.deploymentUuid,
            instanceAction.applicationSection,
            instanceCollection.parentUuid,
            state
          );
          log.trace(
            "localCacheSliceObject handleInstanceAction delete received sliceEntityAdapter",
            sliceEntityAdapter,
            "for instanceCollection",
            instanceCollection,
            "state",
            JSON.stringify(state[instanceCollectionEntityIndex])
          );

          sliceEntityAdapter.removeMany(
            state[instanceCollectionEntityIndex],
            instanceCollection.instances.map((i) => i.uuid)
          );
          log.trace(
            "localCacheSliceObject handleInstanceAction delete state after removeMany for instanceCollection",
            instanceCollection,
            "state",
            JSON.stringify(state[instanceCollectionEntityIndex])
          );
          // log.trace(
          //   "localCacheSliceObject handleInstanceAction delete state after",
          //   JSON.stringify(state[instanceCollectionEntityIndex])
          // );
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
      for (let instanceCollection of instanceAction.objects) {
        const instanceCollectionEntityIndex = getLocalCacheSliceIndex(
          instanceAction.deploymentUuid,
          instanceAction.applicationSection,
          instanceCollection.parentUuid
        );
        const sliceEntityAdapter = getInitializedSectionEntityAdapter(
          instanceAction.deploymentUuid,
          instanceAction.applicationSection,
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
    case "replaceLocalCache": {
      log.info("localCacheSlice handleInstanceAction replaceLocalCache called!");
      for (const instanceCollection of instanceAction.objects) {
        ReplaceInstancesForSectionEntity(
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
  return ACTION_OK
}


//#########################################################################################
function handleModelAction(
  state: LocalCacheSliceState,
  deploymentUuid: Uuid,
  action: ModelAction
): ActionReturnType {
  log.info(
    "localCacheSliceObject handleModelAction called",
    action.actionName,
    "deploymentUuid",
    deploymentUuid,
    "action",
    action, 
    // "state",
    // state
  );
  // TODO: fail in case of Transactional Entity (Entity, EntityDefinition...)?
  switch (action.actionType) {
    case "modelAction": {
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
    default: {
      log.warn("localCacheSliceObject handleDomainEntityAction could not handle action:", JSON.stringify(action, undefined, 2))
      break;
    }
  }
  return ACTION_OK;
}

//#########################################################################################
function handleEndpointAction(
  state: LocalCacheSliceState,
  action: InstanceAction
): ActionReturnType {
  // log.info(
  //   "localCacheSliceObject handleEndpointAction called",
  //   action.actionName,
  //   "deploymentUuid",
  //   deploymentUuid,
  //   "action",
  //   action
  // );
  switch (action.actionType) {
    case "instanceAction": {
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

function actionReturnTypeToException(a:ActionReturnType) {
  if (a.status == "error") {
    throw new Error("caught error on return value " + JSON.stringify(a.error, undefined, 2));
  }
}

//#########################################################################################
//# SLICE
//#########################################################################################
export const localCacheSliceObject: Slice<LocalCacheSliceState> = createSlice({
  name: localCacheSliceName,
  initialState: {} as LocalCacheSliceState,
  reducers: {
    [localCacheSliceInputActionNamesObject.handleLocalCacheTransactionalInstanceAction](
      state: LocalCacheSliceState,
      action: PayloadAction<LocalCacheTransactionalInstanceActionWithDeployment>
    ): void {
      actionReturnTypeToException(handleInstanceAction(state, 
        action.payload.instanceAction
      ));
    },
    [localCacheSliceInputActionNamesObject.handleUndoRedoAction](
      state: LocalCacheSliceState,
      action: PayloadAction<UndoRedoAction>
    ): void {
      log.debug(
        "localCacheSliceObject handleUndoRedoAction deploymentUuid",
        action.payload.deploymentUuid,
        "action has no effect",
        JSON.stringify(action, undefined, 2)
      );
    },
    [localCacheSliceInputActionNamesObject.handleModelAction](
      state: LocalCacheSliceState,
      action: PayloadAction<ModelAction>
    ): void {
      actionReturnTypeToException(handleModelAction(state, action.payload.deploymentUuid, action.payload));
    },
    [localCacheSliceInputActionNamesObject.handleInstanceAction](
      state: LocalCacheSliceState,
      action: PayloadAction<InstanceAction>
    ): void {
      actionReturnTypeToException(handleInstanceAction(state, action.payload));
    },
    [localCacheSliceInputActionNamesObject.handleEndpointAction](
      state: LocalCacheSliceState,
      action: PayloadAction<InstanceAction>
    ): void {
      actionReturnTypeToException(handleEndpointAction(state, action.payload));
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
