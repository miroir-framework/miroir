import {
  ActionCreatorWithPayload,
  EntityAdapter,
  EntityState,
  PayloadAction,
  Slice,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { memoize as _memoize } from "lodash";
import {
  ApplicationSection,
  DomainAction,
  DomainActionWithDeployment,
  DomainDataAction,
  DomainStateSelector,
  DomainTransactionalAction,
  DomainTransactionalReplaceLocalCacheAction,
  EntitiesDomainState,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
  ModelEntityUpdateConverter,
  Uuid,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition
} from "miroir-core";
import {
  NewLocalCacheSliceState,
  ReduxStateWithUndoRedo,
  localCacheSliceInputActionNames,
  localCacheSliceInputActionNamesObject,
  localCacheSliceName,
} from "./localStoreInterface";

//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export function getPromiseActionStoreActionNames(promiseActionNames: string[]): string[] {
  return promiseActionNames.reduce((acc: string[], curr) => acc.concat([curr, "saga-" + curr, curr + "/rejected"]), []);
}

export const localCacheSliceGeneratedActionNames = getPromiseActionStoreActionNames(localCacheSliceInputActionNames);


export function getLocalCacheSliceIndex(
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  entityUuid: Uuid
): string {
  return deploymentUuid + "_" + applicationSection + "_" + entityUuid;
}

//#########################################################################################
// INTERFACE
//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectInstancesForSectionEntity = (
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined,
  entityUuid: string | undefined
) => {
  return createSelector(
    (state: ReduxStateWithUndoRedo) => {
      // console.log('selectInstancesForSectionEntity',deploymentUuid,section,entityUuid);

      if (deploymentUuid && section && entityUuid) {
        const innerState = state.presentModelSnapshot;
        const index = getLocalCacheSliceIndex(deploymentUuid, section, entityUuid);
        const instances: EntityState<EntityInstance> =
          innerState && deploymentUuid && section && entityUuid && innerState[index]
            ? innerState[index]
            : { ids: [], entities: {} };
        // console.log('selectInstancesForDeploymentEntity deploymentUuid',deploymentUuid,'entityUuid', entityUuid,'state',state,'instances',instances);
        return instances;
      } else {
        return { ids: [], entities: {} };
      }
    },
    (items: any) => items
  );
};
// )

//#########################################################################################
export const applySelectorToDomainStateSection =
  // :(deploymentUuid:string|undefined, section:ApplicationSection|undefined) => (selector: DomainStateSelector) => (state: ReduxStateWithUndoRedo) => EntityInstance[]
  (deploymentUuid: string | undefined, section: ApplicationSection | undefined, selector: DomainStateSelector) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        const deployments = state?.presentModelSnapshot;
        const domainState: EntitiesDomainState = Object.fromEntries(
          Object.entries(deployments)
            .filter((e) => new RegExp(deploymentUuid + "_" + section + "_").test(e[0]))
            .map((e) => {
              // console.log("selectInstancesFromDomainSelector miroirInstances", e);
              // removes the e[1].ids, that is imposed by the use of Redux's EntityAdapter
              const entityUuid = new RegExp(/_([0-9a-fA-F\-]+)$/).exec(e[0] ? e[0] : "");
              return [entityUuid ? entityUuid[1] : "", e[1].entities];
            })
        ) as EntitiesDomainState;
        console.log("applySelectorToDomainStateSection domainState", domainState);
        return selector(domainState);
      },
      (items: EntityInstance[]) => items
    );
  };

//#########################################################################################
// IMPLEMENTATION
//#########################################################################################
const getLocalCacheSliceEntityAdapter: (entityUuid: string) => EntityAdapter<EntityInstance> = _memoize(
  (entityUuid: string) => {
    // console.log("getEntityAdapter creating EntityAdapter For entity", parentName);
    const result: EntityAdapter<EntityInstance> = createEntityAdapter<EntityInstance>({
      // Assume IDs are stored in a field other than `book.id`
      selectId: (entity) => entity.uuid,
      // Keep the "all IDs" array sorted based on book titles
      // sortComparer: (a, b) => a.name.localeCompare(b.name),
    });

    console.log("getEntityAdapter creating EntityAdapter For entity", entityUuid, "result", result);

    return result;
  }
);

//#########################################################################################
// DOES SIDE EFFECT ON STATE!!!!!!!!!!!!
function getInitializedSectionEntityAdapter(
  deploymentUuid: string,
  section: ApplicationSection,
  entityUuid: string,
  state: NewLocalCacheSliceState
) {
  // TODO: refactor so as to avoid side effects!
  const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(entityUuid);
  const index = getLocalCacheSliceIndex(deploymentUuid, section, entityUuid);
  if (!state) {
    // console.log('getInitializedDeploymentEntityAdapter state is undefined, initializing state!',JSON.stringify(state),state == undefined);
    state = { [index]: sliceEntityAdapter.getInitialState() } as NewLocalCacheSliceState;
  } else {
    if (!state[index]) {
      state[index] = sliceEntityAdapter.getInitialState();
    }
  }
  // console.log('getInitializedDeploymentEntityAdapter state',JSON.stringify(state));
  return sliceEntityAdapter;
}

//#########################################################################################
//# REDUCER FUNCTION
//#########################################################################################
// function ReplaceInstancesForDeploymentEntity(deploymentUuid: string, state: NewLocalCacheSliceState, action: PayloadAction<EntityInstanceCollection>) {
function ReplaceInstancesForSectionEntity(
  deploymentUuid: string,
  section: ApplicationSection,
  state: NewLocalCacheSliceState,
  instanceCollection: EntityInstanceCollection
) {
  // console.log('ReplaceInstancesForSectionEntity',deploymentUuid,section,instanceCollection);
  const entityEntityIndex = getLocalCacheSliceIndex(deploymentUuid, "model", entityEntity.uuid);
  const instanceCollectionEntityIndex = getLocalCacheSliceIndex(deploymentUuid, section, instanceCollection.parentUuid);
  const entity = state[entityEntityIndex]?.entities[instanceCollection.parentUuid];
  console.log(
    "ReplaceInstancesForDeploymentEntity for deployment",
    deploymentUuid,
    "entity",
    entity ? (entity as any)["name"] : "entity not found for deployment"
  );
  const sliceEntityAdapter = getInitializedSectionEntityAdapter(
    deploymentUuid,
    section,
    instanceCollection.parentUuid,
    state
  );

  state[instanceCollectionEntityIndex] = sliceEntityAdapter.setAll(
    state[instanceCollectionEntityIndex],
    instanceCollection.instances
  );
  // console.log('ReplaceInstancesForDeploymentEntity for deployment',deploymentUuid, 'entity',action.payload.parentUuid,action.payload.parentName);
}

//#########################################################################################
function handleLocalCacheNonTransactionalAction(
  state: NewLocalCacheSliceState,
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  action: DomainDataAction
) {
  // const deploymentUuid = applicationDeploymentMiroir.uuid
  console.log(
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
        // console.log('create for entity',instanceCollection.parentName, instanceCollection.parentUuid, 'instances', instanceCollection.instances, JSON.stringify(state));

        const sliceEntityAdapter = getInitializedSectionEntityAdapter(
          deploymentUuid,
          applicationSection,
          instanceCollection.parentUuid,
          state
        );

        // console.log('localCacheSliceObject handleLocalCacheNonTransactionalAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state before insert',JSON.stringify(state));

        sliceEntityAdapter.addMany(state[instanceCollectionEntityIndex], instanceCollection.instances);
        // sliceEntityAdapter.addMany(state[deploymentUuid][applicationSection][instanceCollection.parentUuid], instanceCollection.instances);

        // console.log('localCacheSliceObject handleLocalCacheNonTransactionalAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state after insert',JSON.stringify(state));

        if (instanceCollection.parentUuid == entityDefinitionEntityDefinition.uuid) {
          // TODO: does it work? How?
          // console.log('localCacheSliceObject handleLocalCacheNonTransactionalAction creating entityAdapter for Entities',instanceCollection.instances.map((i:EntityInstanceWithName)=>i['name']));

          instanceCollection.instances.forEach((i) =>
            getInitializedSectionEntityAdapter(deploymentUuid, applicationSection, i["uuid"], state)
          );
        }
        // console.log('create done',JSON.stringify(state[deploymentUuid][applicationSection]));
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
        // console.log('localCacheSliceObject handleLocalCacheNonTransactionalAction delete', instanceCollection);

        const sliceEntityAdapter = getInitializedSectionEntityAdapter(
          deploymentUuid,
          applicationSection,
          instanceCollection.parentUuid,
          state
        );
        // console.log('localCacheSliceObject handleLocalCacheNonTransactionalAction delete state before',JSON.stringify(state[deploymentUuid][applicationSection][instanceCollection.parentUuid]));

        sliceEntityAdapter.removeMany(
          state[instanceCollectionEntityIndex],
          instanceCollection.instances.map((i) => i.uuid)
        );
        // sliceEntityAdapter.removeMany(state[deploymentUuid][applicationSection][instanceCollection.parentUuid], instanceCollection.instances.map(i => i.uuid));
        console.log(
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
        // sliceEntityAdapter.updateMany(state[deploymentUuid][applicationSection][instanceCollection.parentUuid], instanceCollection.instances.map(i => ({ id: i.uuid, changes: i })));
        // getSliceEntityAdapter(action.payload.parentName).updateOne(state[action.payload.parentName], entityUpdate);
      }
      break;
    }
    default:
      console.warn(
        "localCacheSliceObject handleLocalCacheNonTransactionalAction action could not be taken into account, unkown action",
        action.actionName
      );
  }
}

//#########################################################################################
function handleLocalCacheModelAction(
  state: NewLocalCacheSliceState,
  deploymentUuid: Uuid,
  action: DomainTransactionalAction
) {
  // const deploymentUuid = applicationDeploymentMiroir.uuid;
  console.log(
    "localCacheSliceObject handleLocalCacheModelAction called",
    action.actionName,
    "deploymentUuid",
    deploymentUuid,
    "action",
    action
  );
  switch (action.actionName) {
    case "replaceLocalCache": {
      const castAction: DomainTransactionalReplaceLocalCacheAction = action;
      console.log("localCacheSliceObject replaceLocalCache", deploymentUuid, action);

      for (let instanceCollection of action.objects) {
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
      // console.log('localCacheSliceObject handleLocalCacheModelAction deploymentUuid',deploymentUuid,'UpdateMetaModelInstance',action);
      const domainDataAction: DomainDataAction = {
        actionType: "DomainDataAction",
        actionName: action.update.updateActionName,
        objects: action.update.objects,
      };
      console.log("localCacheSliceObject handleLocalCacheModelAction updateModel domainDataAction", domainDataAction);

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
      // console.log('localCacheSliceObject deploymentUuid',deploymentUuid,'updateModel',action, state[deploymentUuid],state[deploymentUuid]);
      // console.log('localCacheSliceObject handleLocalCacheModelAction deploymentUuid',deploymentUuid,'updateModel',action, state);
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
      console.log(
        "localCacheSliceObject handleLocalCacheModelAction updateModel deploymentUuid",
        deploymentUuid,
        "domainDataAction",
        domainDataAction
      );

      handleLocalCacheNonTransactionalAction(state, deploymentUuid, "model", domainDataAction);
      break;
    }
    default:
      console.warn(
        "localCacheSliceObject handleLocalCacheModelAction deploymentUuid",
        deploymentUuid,
        "action could not be taken into account, unkown action",
        action.actionName
      );
  }
}

//#########################################################################################
function handleLocalCacheAction(state: NewLocalCacheSliceState, deploymentUuid: Uuid, action: DomainAction) {
  console.log(
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
      console.warn(
        "localCacheSliceObject handleLocalCacheAction action could not be taken into account, unkown action",
        action
      );
  }
}

//#########################################################################################
//# SLICE
//#########################################################################################
export const localCacheSliceObject: Slice<NewLocalCacheSliceState> = createSlice({
  name: localCacheSliceName,
  initialState: {} as NewLocalCacheSliceState,
  reducers: {
    [localCacheSliceInputActionNamesObject.handleLocalCacheAction](
      state: NewLocalCacheSliceState,
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
