import {
  ActionCreatorWithPayload, createEntityAdapter,
  createSelector,
  createSlice,
  EntityAdapter,
  EntityState,
  PayloadAction,
  Slice
} from "@reduxjs/toolkit";
import { memoize as _memoize } from "lodash";
import {
  DomainState,
  DomainStateSelector,
  Instance,
  InstanceCollection,
  DomainDataAction,
  DomainModelAction,
  ModelEntityUpdateConverter,
  EntityDefinition,
  DomainAction,
  entityEntity,
} from "miroir-core";
import { ReduxStateChanges, ReduxStateWithUndoRedo } from "./UndoRedoReducer";

export const localCacheSliceName:string = "localCache";
//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const localCacheSliceInputActionNamesObject = {
  handleLocalCacheModelAction: "handleLocalCacheModelAction",
  handleLocalCacheDataAction: "handleLocalCacheDataAction",
  handleLocalCacheAction: "handleLocalCacheAction",
  // UpdateInstancesForEntity: "UpdateInstancesForEntity",
  // AddInstancesForEntity: "AddInstancesForEntity",
};
export type LocalCacheSliceInputActionNamesObjectTuple = typeof localCacheSliceInputActionNamesObject;
export type LocalCacheSliceInputActionNamesKey = keyof LocalCacheSliceInputActionNamesObjectTuple;
export const localCacheSliceInputActionNames = Object.values(localCacheSliceInputActionNamesObject);
export const localCacheSliceInputFullActionNames = Object.values(localCacheSliceInputActionNamesObject).map(n=>localCacheSliceName+'/'+n); // TODO: use map type?

export function getPromiseActionStoreActionNames(promiseActionNames:string[]):string[] {
  return promiseActionNames 
    .reduce(
      (acc:string[],curr) => acc.concat([curr,'saga-' + curr,curr+'/rejected']),[]
    )
  ;
}

export const localCacheSliceGeneratedActionNames = getPromiseActionStoreActionNames(localCacheSliceInputActionNames);

//#########################################################################################
//# DATA TYPES
//#########################################################################################
// instance slice state cannot really be defined statically, since it changes at run-time, depending on the set of defined instances
export interface LocalCacheSliceState {
  [entityUuid: string]: EntityState<Instance>;
}


// export type DomainDataAction = PayloadAction<InstanceCollection>;

//#########################################################################################
//# Entity Adapter
//#########################################################################################
const getLocalCacheSliceEntityAdapter: (
  // entityName: string
  entityUuid: string
) => EntityAdapter<Instance> = _memoize(
  (entityUuid: string) => {
    // console.log("getEntityAdapter creating EntityAdapter For entity", entityName);
    const result = createEntityAdapter<Instance>({
      // Assume IDs are stored in a field other than `book.id`
      selectId: (entity) => entity.uuid,
      // Keep the "all IDs" array sorted based on book titles
      // sortComparer: (a, b) => a.name.localeCompare(b.name),
    });

    console.log("getEntityAdapter creating EntityAdapter For entity", entityUuid,"result",result);

    return result;
  }
);

function getInitializedEntityAdapter(entityUuid: string, state: LocalCacheSliceState) {
  // TODO: refactor so as to avoid side effects!
  const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(entityUuid);
  if (state[entityUuid] == undefined) {
    console.log('getInitializedEntityAdapter for',entityUuid,'initializing state!');
    
    state[entityUuid] = sliceEntityAdapter.getInitialState();
  }
  return sliceEntityAdapter;
} 

//#########################################################################################
//# REDUCER FUNCTION
//#########################################################################################
function ReplaceInstancesForEntity(state: LocalCacheSliceState, action: PayloadAction<InstanceCollection>) {
  console.log('ReplaceInstancesForEntity', action.payload.entity,action.payload.entityUuid,action.payload.instances);
  const sliceEntityAdapter = getInitializedEntityAdapter(action.payload.entityUuid,state);

  state[action.payload.entityUuid] = sliceEntityAdapter.setAll(state[action.payload.entityUuid], action.payload.instances);
}


//#########################################################################################
function handleLocalCacheDataAction(state: LocalCacheSliceState, action: PayloadAction<DomainDataAction>) {
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheDataAction, 'called', action);
  switch (action.payload.actionName) {
    case 'create': {
      for (let instanceCollection of action.payload.objects) {
        console.log('create for entity',instanceCollection.entity, instanceCollection.entityUuid, 'instances', instanceCollection.instances, JSON.stringify(state));
        
        const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entityUuid, state);
        console.log('localCacheSliceObject handleLocalCacheDataAction', instanceCollection.entity, instanceCollection.entityUuid, 'state before insert',JSON.stringify(state));
        sliceEntityAdapter.addMany(state[instanceCollection.entityUuid], instanceCollection.instances);
        console.log('localCacheSliceObject handleLocalCacheDataAction', instanceCollection.entity, instanceCollection.entityUuid, 'state after insert',JSON.stringify(state));
        if(instanceCollection.entityUuid == entityEntity.uuid) {
          console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheDataAction,'creating entityAdapter for Entities',instanceCollection.instances.map(i=>i['name']));
          
          instanceCollection.instances.forEach(i=>getInitializedEntityAdapter(i['uuid'], state));
        }
        console.log('create done',JSON.stringify(state[instanceCollection.entityUuid]));
      }
      break;
    }
    case 'delete': {
      for (let instanceCollection of action.payload.objects) {
        console.log('localCacheSliceObject handleLocalCacheDataAction delete', instanceCollection);
        
        const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entityUuid, state);
        console.log('localCacheSliceObject handleLocalCacheDataAction delete state before',JSON.stringify(state[instanceCollection.entityUuid]));
        
        sliceEntityAdapter.removeMany(state[instanceCollection.entityUuid], instanceCollection.instances.map(i => i.uuid));
        console.log('localCacheSliceObject handleLocalCacheDataAction delete state after',JSON.stringify(state[instanceCollection.entityUuid]));
      }
      break;
    }
    case 'update': {
      for (let instanceCollection of action.payload.objects) {
        const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entityUuid, state);
        sliceEntityAdapter.updateMany(state[instanceCollection.entityUuid], instanceCollection.instances.map(i => ({ id: i.uuid, changes: i })));
        // getSliceEntityAdapter(action.payload.entity).updateOne(state[action.payload.entity], entityUpdate);
      }
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheModelAction action could not be taken into account, unkown action', action.payload.actionName);
  }
}

//#########################################################################################
function handleLocalCacheModelAction(state: LocalCacheSliceState, action: PayloadAction<DomainModelAction>) {
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheModelAction, 'called', action);
  switch (action.payload.actionName) {
    case 'replace': {
      for (let instanceCollection of action.payload.objects) {
        ReplaceInstancesForEntity(state, { type: "ReplaceInstancesForEntity", payload: instanceCollection } as PayloadAction<InstanceCollection>);
      }
      break;
    }
    case 'commit': {
      // reset transation contents
      // send ModelEntityUpdates to server for execution?
      // for (let instanceCollection of action.payload.objects) {
      //   ReplaceInstancesForEntity(state, { type: "ReplaceInstancesForEntity", payload: instanceCollection } as PayloadAction<InstanceCollection>);
      // }
      break;
    }
    // case 'create':
    // case 'update':
    // case 'delete': {
    //   handleLocalCacheDataAction(
    //     state, {
    //       type:'rebound',
    //       payload:{
    //         actionType:"DomainDataAction",
    //         actionName:action.payload.actionName,
    //         objects:action.payload.objects,
    //       }
    //     }
    //   )
    //   break;
    // }
    case "UpdateMetaModelInstance": {
      console.log('localCacheSliceObject CUDupdateModel',action.payload);
      const domainDataAction:DomainDataAction = {
        actionType:"DomainDataAction",
        actionName:action.payload.update.updateActionName,
        objects: action.payload.update.objects
      }
      ;
      console.log('updateModel domainDataAction',domainDataAction);

      handleLocalCacheDataAction(
        state, {
          type:'rebound',
          payload: domainDataAction
        }
      )
      break;
    }
    case "updateEntity": {
      console.log('localCacheSliceObject updateModel',action.payload);
      // infer from ModelEntityUpdates the CUD actions to be performed on model Entities, Reports, etc.
      // send CUD actions to local cache
      // have undo / redo contain both(?) local cache CUD actions and ModelEntityUpdates
      const domainDataAction:DomainDataAction = 
        ModelEntityUpdateConverter.modelEntityUpdateToLocalCacheUpdate(
          Object.values(state[entityEntity.uuid].entities) as EntityDefinition[],
          action.payload.update.modelEntityUpdate
        )
      ;
      console.log('updateModel domainDataAction',domainDataAction);

      handleLocalCacheDataAction(
        state, {
          type:'rebound',
          payload: domainDataAction
        }
      )
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheModelAction action could not be taken into account, unkown action', action.payload.actionName);
  }
}

//#########################################################################################
function handleLocalCacheAction(state: LocalCacheSliceState, action: PayloadAction<DomainAction>) {
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheAction, 'actionType',action.payload.actionType, 'called', action);
  switch (action.payload.actionType) {
    case 'DomainDataAction': {
      handleLocalCacheDataAction(state,action as PayloadAction<DomainDataAction>);
      break;
    }
    case 'DomainModelAction': {
      handleLocalCacheModelAction(state,action  as PayloadAction<DomainModelAction>);
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheAction action could not be taken into account, unkown action', action.payload);
  }
}

//#########################################################################################
//# SLICE
//#########################################################################################
export const localCacheSliceObject: Slice<LocalCacheSliceState> = createSlice({
  name: localCacheSliceName,
  initialState: { [entityEntity.uuid]: getLocalCacheSliceEntityAdapter(entityEntity.uuid).getInitialState() },
  reducers: {
    [localCacheSliceInputActionNamesObject.handleLocalCacheAction](state: LocalCacheSliceState, action: PayloadAction<DomainAction>) {
      handleLocalCacheAction(state,action);
    },
  },
});

//#########################################################################################
//# SELECTORS
//#########################################################################################
export const selectMiroirEntityInstances = createSelector(
  (state: LocalCacheSliceState) => state,
  (items) => items
);

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectCurrentTransaction: () => ((state: ReduxStateWithUndoRedo) => ReduxStateChanges[]) = 
// _memoize(
  () => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        return state.pastModelPatches;
      },
      (items: ReduxStateChanges[]) => items
    );
  }
// )
;

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectInstancesForEntity: (entityUuid: string) => any = _memoize(
  (entityUuid: string) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        return state.presentModelSnapshot.miroirInstances[entityUuid];
      },
      (items: EntityState<any>) => items
    );
  }
);

//#########################################################################################
export const selectInstancesFromDomainSelector: (
  selector: DomainStateSelector
) => (state: ReduxStateWithUndoRedo) => Instance[] =
  // _memoize(
  // (entityName: string) => {
  (selector: DomainStateSelector) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        const domainState: DomainState = Object.fromEntries(
          Object.entries(state.presentModelSnapshot.miroirInstances).map((e) => {
            // console.log("selectInstancesFromDomainSelector miroirInstances", e);
            return [e[0], e[1].entities];
          })
        ) as DomainState;
        // console.log("selectInstancesFromDomainSelector domainState",domainState)
        return selector(domainState);
      },
      (items: Instance[]) => items
    );
  };
// }
// )


//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
// export const mInstanceSliceActionsCreators:{[actionCreatorName:string]:any} = {
type LocalCacheSliceActionCreator<P> =
  | ActionCreatorWithPayload<P, `${string}/${string}`>
  // | ActionCreatorWithoutPayload<`${string}/${string}`>
;

const actionsCreators: {
  [actionCreatorName: string]: LocalCacheSliceActionCreator<any>;
} = {
  ...localCacheSliceObject.actions,
};

export const LocalCacheSlice = {
  reducer: localCacheSliceObject.reducer,
  actionCreators: actionsCreators,
  inputActionNames: localCacheSliceInputActionNamesObject,
};

export default {};
