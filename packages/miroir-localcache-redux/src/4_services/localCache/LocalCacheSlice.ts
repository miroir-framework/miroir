import {
  EntityAdapter,
  PayloadAction,
  Slice,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import lodash from 'lodash';
const { memoize: _memoize } = lodash;

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
  LocalCacheAction,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  ModelAction,
  ModelEntityActionTransformer,
  Report,
  StoreBasedConfiguration,
  Uuid,
  applicationDeploymentMiroir,
  entityApplicationVersion,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  Menu,
  entityReport,
  entityStoreBasedConfiguration,
  getLoggerName,
  Entity,
  DeploymentEntityState
} from "miroir-core";

import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import {
  LocalCacheSliceState,
  LocalCacheSliceStateZone,
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
export function getPersistenceActionReduxEventNames(promiseActionNames: string[]): string[] {
  return promiseActionNames.reduce((acc: string[], curr) => acc.concat([curr, "saga-" + curr, curr + "/rejected"]), []);
}

export const localCacheSliceGeneratedActionNames = getPersistenceActionReduxEventNames(localCacheSliceInputActionNames);


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
      const modelSection = deploymentUuid == applicationDeploymentMiroir.uuid?"data":"model";
      const applicationVersions = state.current[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityApplicationVersion.uuid)];
      const configuration = state.current[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityStoreBasedConfiguration.uuid)];
      const entities = state.current[getLocalCacheSliceIndex(deploymentUuid, metaModelSection, entityEntity.uuid)];
      const entityDefinitions = state.current[getLocalCacheSliceIndex(deploymentUuid, metaModelSection, entityEntityDefinition.uuid)];
      const jzodSchemas = state.current[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityJzodSchema.uuid)];
      const menus = state.current[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityMenu.uuid)];
      const reports = state.current[getLocalCacheSliceIndex(deploymentUuid, modelSection, entityReport.uuid)];
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
  const entityInstancesLocationIndex = getLocalCacheSliceIndex(deploymentUuid, section, entityUuid);
  // log.debug("getInitializedSectionEntityAdapter called", "deploymentUuid", deploymentUuid, "section", section, "entityUuid", entityUuid, "index", index);
  // const sliceEntityAdapter = getLocalCacheSliceEntityAdapter();
  if (!(state as any)[zone][entityInstancesLocationIndex]) {
    (state as any)[zone][entityInstancesLocationIndex] = entityAdapter.getInitialState();
    log.info(
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
  // log.debug('loadNewInstancesForSectionEntity',deploymentUuid,section,instanceCollection);
  const instanceCollectionEntityIndex = getLocalCacheSliceIndex(deploymentUuid, section, instanceCollection.parentUuid);
  // log.info(
  //   "ReplaceInstancesForDeploymentEntity for deployment",
  //   deploymentUuid,
  //   "entity",
  //   entity ? (entity as any)["name"] : "entity not found for deployment"
  // );
  const sliceEntityAdapter = initializeLocalCacheSliceStateWithEntityAdapter(
    deploymentUuid,
    section,
    instanceCollection.parentUuid,
    "loading",
    state
  );

    (state as any).loading[instanceCollectionEntityIndex] = sliceEntityAdapter.setAll(
      (state as any).loading[instanceCollectionEntityIndex],
      instanceCollection.instances
    );
  // log.info("loadNewInstancesInLocalCache returned state", JSON.stringify(state))
}

// // ################################################################################################
// const deleteCascade = async (p:{
//   deploymentUuid: string,
//   section: ApplicationSection,
//   state: LocalCacheSliceState,
//   instanceCollection: EntityInstanceCollection
//   // 
//   entity: Entity,
//   entityDefinition: EntityDefinition,
//   entityInstances: EntityInstance[]
// }) => {
//   // No need to fetch list of objects pointing to current list of objects
//   const deleteCascadeForeignKeyObjectsAttributeDefinition:[string, JzodElement][] = 
//     Object.entries(
//       p.entityDefinition.jzodSchema.definition ?? {}
//     ).filter((e) => e[1].extra?.targetEntity)
//   ;

//   const deleteCascadeforeignKeyObjectsFetchQuery: DomainManyQueriesWithDeploymentUuid = {
//     queryType: "DomainManyQueries",
//     deploymentUuid: props.deploymentUuid,
//     // applicationSection: props.applicationSection,
//     pageParams: props.paramsAsdomainElements,
//     queryParams: { elementType: "object", elementValue: {} },
//     contextResults: { elementType: "object", elementValue: {} },
//     fetchQuery: {
//       select: Object.fromEntries(
//         deleteCascadeForeignKeyObjectsAttributeDefinition.map((e) => [
//             e[1].extra?.targetEntity,
//             {
//               queryType: "selectObjectListByEntity",
//               applicationSection: (props.paramsAsdomainElements as any)["applicationSection"],
//               parentName: "",
//               parentUuid: {
//                 referenceType: "constant",
//                 referenceUuid: e[1].extra?.targetEntity,
//               },
//             },
//           ])
//       ) as any,
//     }
//   };

//   const domainState = localCache.getDomainState();
//   // log.info("localCacheSliceObject handleDomainEntityAction queryAction domainState=", JSON.stringify(domainState, undefined, 2))
//   // const queryResult: DomainElement = selectByDomainManyQueriesFromDomainState(domainState, getSelectorParams(query));
//   // const queryResult: DomainElement = selectByDomainManyQueriesFromDomainState(domainState, getSelectorParams(query));

//   const foreignKeyObjects: Record<string,EntityInstancesUuidIndex> = selectByDomainManyQueriesFromDomainState(domainState, getSelectorParams(deleteCascadeforeignKeyObjectsFetchQuery))

//   // const deleteCascadeforeignKeyObjectsFetchQueryParams: DomainStateQuerySelectorParams<DomainManyQueriesWithDeploymentUuid> = 
//   //   getSelectorParams<DomainManyQueriesWithDeploymentUuid>(deleteCascadeforeignKeyObjectsFetchQuery,
//   //     selectorMap
//   //   )
//   // ;
//   // const foreignKeyObjects: Record<string,EntityInstancesUuidIndex> = useDomainStateQuerySelectorForCleanedResult(
//   //   selectorMap.selectByDomainManyQueriesFromDomainState as DomainStateSelectorNew<DomainManyQueriesWithDeploymentUuid, any>,
//   //   foreignKeyObjectsFetchQueryParams
//   // );


//   // delete current list of objects (on a relational database, this would require suspending foreign key constraints for the involved relations)
//   const deleteCurrentEntityInstancesAction: InstanceAction = {
//     actionType: "instanceAction",
//     actionName: "deleteInstance",
//     applicationSection: props.chosenApplicationSection?props.chosenApplicationSection:"data",
//     deploymentUuid: props.displayedDeploymentDefinition.uuid,
//     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//     objects: entityInstances.length > 0?[
//       {
//         parentName: (entityInstances[0] as any)["name"]??"undefined name",
//         parentUuid: entityInstances[0].parentUuid,
//         applicationSection:props.chosenApplicationSection?props.chosenApplicationSection:"data",
//         instances: entityInstances,
//       },
//     ]:[]
//   };
// }


//#########################################################################################
// 
function handleInstanceAction(
  state: LocalCacheSliceState,
  instanceAction: InstanceAction
): ActionReturnType {
  // log.info(
  //   "localCacheSliceObject handleInstanceAction deploymentUuid",
  //   instanceAction.deploymentUuid,
  //   "actionName",
  //   instanceAction.actionName,
  //   "called",
  //   // JSON.stringify(action, null, 2)
  //   instanceAction
  // );
  switch (instanceAction.actionName) {
    case "createInstance": {
      for (let instanceCollection of instanceAction.objects ?? ([] as EntityInstanceCollection[])) {
        const instanceCollectionEntityIndex = getLocalCacheSliceIndex(
          instanceAction.deploymentUuid,
          instanceAction.applicationSection,
          instanceCollection.parentUuid
        );
        // log.debug(
        //   "create for entity",
        //   instanceCollection.parentName,
        //   instanceCollection.parentUuid,
        //   "instances",
        //   instanceCollection.instances
        //   // JSON.stringify(state)
        // );

        const sliceEntityAdapter = initializeLocalCacheSliceStateWithEntityAdapter(
          instanceAction.deploymentUuid,
          instanceAction.applicationSection,
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
              instanceAction.applicationSection,
              i["uuid"],
              "current",
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
          // log.debug(
          //   "localCacheSliceObject handleInstanceAction delete called for instanceCollection",
          //   instanceCollection
          // );

          const instanceCollectionEntityIndex = getLocalCacheSliceIndex(
            instanceAction.deploymentUuid,
            instanceAction.applicationSection,
            instanceCollection.parentUuid
          );

          // log.debug(
          //   "localCacheSliceObject handleInstanceAction delete received instanceCollectionEntityIndex",
          //   instanceCollectionEntityIndex
          // );

          const sliceEntityAdapter = initializeLocalCacheSliceStateWithEntityAdapter(
            instanceAction.deploymentUuid,
            instanceAction.applicationSection,
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
            instanceCollection.instances.map((i) => i.uuid)
          );
          // log.trace(
          //   "localCacheSliceObject handleInstanceAction delete state after removeMany for instanceCollection",
          //   instanceCollection,
          //   "state",
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
        const sliceEntityAdapter = initializeLocalCacheSliceStateWithEntityAdapter(
          instanceAction.deploymentUuid,
          instanceAction.applicationSection,
          instanceCollection.parentUuid,
          "current",
          state
        );
        // log.info("localCacheSliceObject handleInstanceAction for index", instanceCollectionEntityIndex, sliceEntityAdapter)
        const updates = instanceCollection.instances.map((i) => ({ id: i.uuid, changes: i }));
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
      for (const instanceCollection of instanceAction.objects) {
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
  );
  // TODO: fail in case of Transactional Entity (Entity, EntityDefinition...)?
  // switch (action.actionType) {
  //   case "modelAction": {
  switch (action.actionName) {
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
// ): ActionReturnType {
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
): ActionReturnType {
  log.info(
    "localCacheSliceObject handleAction called",
    action.actionType,
    "deploymentUuid",
    action.actionType !== "transactionalInstanceAction" ?action.deploymentUuid:action.instanceAction.deploymentUuid,
    "action",
    action
  );
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
    case "modelAction": {
      return handleModelAction(state, action.deploymentUuid,action);
      break;
    }
    case "transactionalInstanceAction": {
      return handleInstanceAction(state, action.instanceAction);
      break;
    }
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
  // actionCreators: actionsCreators,
  actionCreators: {...localCacheSliceObject.actions},
  inputActionNames: localCacheSliceInputActionNamesObject,
};


export default {};
