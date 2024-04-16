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
  DeploymentEntityState,
  getLocalCacheIndexDeploymentSection,
  getLocalCacheIndexDeploymentUuid,
  getLocalCacheIndexEntityUuid,
  getDeploymentEntityStateIndex,
  JzodElement,
  DomainManyQueriesWithDeploymentUuid,
  getSelectorParams,
  selectByDomainManyQueriesFromDomainState,
  selectByDomainManyQueries,
  getDeploymentEntityStateSelectorParams,
  DomainElementObject,
  cleanupResultsFromQuery,
  entityInstance,
  EntityInstanceWithName
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
      const applicationVersions = state.current[getDeploymentEntityStateIndex(deploymentUuid, modelSection, entityApplicationVersion.uuid)];
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
  const instanceCollectionEntityIndex = getDeploymentEntityStateIndex(deploymentUuid, section, instanceCollection.parentUuid);
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

// ################################################################################################
const deleteCascade = (p:{
  deploymentUuid: string,
  applicationSection: ApplicationSection,
  state: LocalCacheSliceState,
  entityDefinition: EntityDefinition,
  entityDefinitions: EntityDefinition[],
  entityInstances: EntityInstance[]
}) => {

  log.info("++++++++++++++++++++++++++++ deleteInstanceWithCascade deleteCascade deleting instances of entity", p.entityDefinition.name, p.entityInstances)

  // finding all entities which have an attribute pointing to the current entity
  const foreignKeysPointingToEntity = Object.fromEntries(
    Object.entries(p.entityDefinitions)
      .map((e: [string, EntityDefinition]) => {
        const fkAttributes = Object.entries(e[1].jzodSchema.definition).find(
          (a) => a[1].extra?.targetEntity == p.entityDefinition.entityUuid
        );
        return [e[1].entityUuid, fkAttributes ? fkAttributes[0] : undefined];
      })
      .filter((e) => e[1])
  );

  log.info("deleteInstanceWithCascade deleteCascade will delete instances of entities that point to current entity", foreignKeysPointingToEntity)

  const pageParams: DomainElementObject = {
    elementType: "object",
    elementValue: {
      deploymentUuid: {elementType: "string", elementValue: p.deploymentUuid},
      applicationSection: {elementType: "string", elementValue: p.applicationSection},
    }
  };


  const foreignKeyObjectsFetchQuery: DomainManyQueriesWithDeploymentUuid = {
    queryType: "DomainManyQueries",
    deploymentUuid: p.deploymentUuid,
    pageParams,
    queryParams: { elementType: "object", elementValue: {} },
    contextResults: { elementType: "object", elementValue: {} },
    fetchQuery: {
      select: Object.fromEntries(
          Object.keys(foreignKeysPointingToEntity).map((entityUuid) => [
            entityUuid,
            {
              queryType: "selectObjectListByEntity",
              applicationSection: p.applicationSection,
              parentName: "",
              parentUuid: {
                referenceType: "constant",
                referenceUuid: entityUuid,
              },
            },
          ])
      ) as any,
    }
  };

  const foreignKeyUnfilteredObjects: DomainElementObject = cleanupResultsFromQuery(
    selectByDomainManyQueries<DeploymentEntityState>(
      p.state.current,
      getDeploymentEntityStateSelectorParams(foreignKeyObjectsFetchQuery)
    )
  );

  log.info(
    "deleteInstanceWithCascade deleteCascade found p.state.current",
    JSON.stringify(p.state.current),
  );
  log.info(
    "deleteInstanceWithCascade deleteCascade found foreign key objects that may be pointing to objects to delete",
    JSON.stringify(foreignKeyUnfilteredObjects),
    "deleteCascadeforeignKeyObjectsFetchQuery",
    foreignKeyObjectsFetchQuery,
  );

  const foreignKeyObjects = Object.fromEntries(Object.entries(foreignKeyUnfilteredObjects).map(
    entity => [
      entity[0],
      Object.values(entity[1]).filter(
        (entityInstance:EntityInstanceWithName)=> p.entityInstances.find(e => e.uuid == (entityInstance as any)[foreignKeysPointingToEntity[entity[0]]]) != undefined
      )
    ]
  ))

  log.info(
    "deleteInstanceWithCascade deleteCascade found foreign key objects pointing to objects to delete",
    JSON.stringify(foreignKeyObjects),
  );


  // delete current list of objects (on a relational database, this would require suspending foreign key constraints for the involved relations)
  const deleteCurrentEntityInstancesAction: InstanceAction = {
    actionType: "instanceAction",
    actionName: "deleteInstance",
    applicationSection: p.applicationSection,
    deploymentUuid: p.deploymentUuid,
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    objects: p.entityInstances.length > 0?[
      {
        parentName: (p.entityInstances[0] as any)["name"]??"undefined name",
        parentUuid: p.entityInstances[0].parentUuid,
        applicationSection:p.applicationSection,
        instances: p.entityInstances,
      },
    ]:[]
  };

  log.info("deleteInstanceWithCascade deleteCascade deleting current instances action", deleteCurrentEntityInstancesAction)
  handleInstanceAction(p.state,deleteCurrentEntityInstancesAction);
  log.info("deleteInstanceWithCascade deleteCascade deleting current instances DONE")
  
  // recursive calls
  for (const entityInstances of Object.entries(foreignKeyObjects)) {
    const entityDefinitionTmp: [string, EntityDefinition] | undefined = Object.entries(p.entityDefinitions ?? {}).find(
      (e: [string, EntityDefinition]) => e[1].entityUuid == entityInstances[0]
    );
    if (!p.entityDefinitions ||  !entityDefinitionTmp) {
      throw new Error("NOT WORKING");
      
    }
    const entityDefinition: EntityDefinition = entityDefinitionTmp[1];
    deleteCascade({
      deploymentUuid:p.deploymentUuid,
      applicationSection: p.applicationSection,
      state: p.state,
      entityDefinition:entityDefinition,
      entityDefinitions: p.entityDefinitions,
      entityInstances: entityInstances[1] as EntityInstance[]
    });
  }
  
  // log.info("deleteInstanceWithCascade deleteCascade foreign key objects to delete", JSON.stringify(foreignKeyObjects));

}


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
        const instanceCollectionEntityIndex = getDeploymentEntityStateIndex(
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
    case "deleteInstanceWithCascade": {

      const entityDefinitionsForinstanceCollection = getDeploymentEntityStateIndex(
        instanceAction.deploymentUuid,
        "model",
        entityEntityDefinition.uuid
        // instanceAction.objects[0].parentUuid
      );
      log.info("handleInstanceAction deleteInstanceWithCascade entityDefinitionsForinstanceCollection",entityDefinitionsForinstanceCollection)


      // const entityDefinition:EntityDefinition = state.current[entityDefinitionsForinstanceCollection].entities[instanceAction.objects[0].parentUuid] as EntityDefinition
      const entityDefinitions: Record<string, EntityDefinition> = state.current[entityDefinitionsForinstanceCollection].entities as Record<string, EntityDefinition>;
      const entityDefinitionTmp: [string, EntityDefinition] | undefined = Object.entries(entityDefinitions??{}).find((e: [string, EntityDefinition]) => e[1].entityUuid == instanceAction.objects[0].parentUuid);
      if (!entityDefinitions ||  !entityDefinitionTmp) {
        throw new Error("NOT WORKING");
        
      }
      const entityDefinition: EntityDefinition = entityDefinitionTmp[1];
      // .find((e: [string, EntityDefinition]) => e.entityUuid == instanceAction.objects[0].parentUuid) as EntityDefinition;


      log.info(
        "handleInstanceAction deleteInstanceWithCascade entityDefinition",
        entityDefinition,
        "entityUuid",
        instanceAction.objects[0].parentUuid,
        "definitions",
        JSON.stringify(state.current[entityDefinitionsForinstanceCollection].entities, null, 2)
      );
      deleteCascade({
        deploymentUuid:instanceAction.deploymentUuid,
        applicationSection: instanceAction.applicationSection,
        state,
        // instanceCollection: instanceAction.objects[0],
        // entity: Entity,
        entityDefinition:entityDefinition,
        entityDefinitions: Object.values(entityDefinitions),
        entityInstances: instanceAction.objects[0].instances
      });

      break;
    }
    case "deleteInstance": {
      for (let instanceCollection of instanceAction.objects) {
        try {
          log.debug(
            "localCacheSliceObject handleInstanceAction delete called for instanceCollection",
            instanceCollection
          );

          const instanceCollectionEntityIndex = getDeploymentEntityStateIndex(
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
      for (let instanceCollection of instanceAction.objects) {
        const instanceCollectionEntityIndex = getDeploymentEntityStateIndex(
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
