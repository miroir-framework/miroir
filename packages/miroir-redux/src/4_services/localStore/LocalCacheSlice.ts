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
  ModelStructureUpdateConverter,
  EntityDefinition,
  DomainAction,
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
  [propName: string]: EntityState<Instance>;
}


// export type DomainDataAction = PayloadAction<InstanceCollection>;

//#########################################################################################
//# Entity Adapter
//#########################################################################################
const getLocalCacheSliceEntityAdapter: (
  entityName: string
) => EntityAdapter<Instance> = _memoize(
  (entityName: string) => {
    // console.log("getEntityAdapter creating EntityAdapter For entity", entityName);
    const result = createEntityAdapter<Instance>({
      // Assume IDs are stored in a field other than `book.id`
      selectId: (entity) => entity.uuid,
      // Keep the "all IDs" array sorted based on book titles
      // sortComparer: (a, b) => a.name.localeCompare(b.name),
    });

    console.log("getEntityAdapter creating EntityAdapter For entity", entityName,"result",result);

    return result;
  }
);

function getInitializedEntityAdapter(entityName: string, state: LocalCacheSliceState) {
  // TODO: refactor so as to avoid side effects!
  const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(entityName);
  if (!state[entityName]) {
    state[entityName] = sliceEntityAdapter.getInitialState();
  }
  return sliceEntityAdapter;
} 

//#########################################################################################
//# REDUCER FUNCTION
//#########################################################################################
function ReplaceInstancesForEntity(state: LocalCacheSliceState, action: PayloadAction<InstanceCollection>) {
  console.log('ReplaceInstancesForEntity', action.payload.entity,action.payload.instances);
  const sliceEntityAdapter = getInitializedEntityAdapter(action.payload.entity,state);

  state[action.payload.entity] = sliceEntityAdapter.setAll(state[action.payload.entity], action.payload.instances);
}


//#########################################################################################
function handleLocalCacheDataAction(state: LocalCacheSliceState, action: PayloadAction<DomainDataAction>) {
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheDataAction, 'called', action);
  switch (action.payload.actionName) {
    case 'create': {
      for (let instanceCollection of action.payload.objects) {
        console.log('create',instanceCollection.entity, instanceCollection.instances, JSON.stringify(state));
        
        const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entity, state);
        sliceEntityAdapter.addMany(state[instanceCollection.entity], instanceCollection.instances);
        if(instanceCollection.entity == 'Entity') {
          console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheDataAction,'creating entityAdapter for Entities',instanceCollection.instances.map(i=>i['name']));
          
          instanceCollection.instances.forEach(i=>getInitializedEntityAdapter(i['name'], state));
        }
        console.log('create done',JSON.stringify(state[instanceCollection.entity]));
      }
      break;
    }
    case 'delete': {
      for (let instanceCollection of action.payload.objects) {
        const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entity, state);
        sliceEntityAdapter.removeMany(state[instanceCollection.entity], action.payload.uuid ? [action.payload.uuid] : instanceCollection.instances.map(i => i.uuid));
      }
      break;
    }
    case 'update': {
      for (let instanceCollection of action.payload.objects) {
        const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entity, state);
        sliceEntityAdapter.updateMany(state[instanceCollection.entity], instanceCollection.instances.map(i => ({ id: i.uuid, changes: i })));
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
      // send ModelStructureUpdates to server for execution?
      // for (let instanceCollection of action.payload.objects) {
      //   ReplaceInstancesForEntity(state, { type: "ReplaceInstancesForEntity", payload: instanceCollection } as PayloadAction<InstanceCollection>);
      // }
      break;
    }
    case 'create':
    case 'update':
    case 'delete': {
      handleLocalCacheDataAction(
        state, {
          type:'rebound',
          payload:{
            actionType:"DomainDataAction",
            actionName:action.payload.actionName,
            objects:action.payload.objects,
          }
        }
      )
      break;
    }
    case "updateModel": {
      console.log('localCacheSliceObject updateModel',action.payload);
      // infer from ModelStructureUpdates the CUD actions to be performed on model Entities, Reports, etc.
      // send CUD actions to local cache
      // have undo / redo contain both(?) local cache CUD actions and ModelStructureUpdates
      const domainDataAction:DomainDataAction = 
        ModelStructureUpdateConverter.modelUpdateToLocalCacheUpdate(
          Object.values(state['Entity'].entities) as EntityDefinition[],
          action.payload.updates[0]
        );
        console.log('updateModel domainDataAction',domainDataAction);
        
      handleLocalCacheDataAction(
        state, {
          type:'rebound',
          payload: domainDataAction
          // {
          //   actionType:"DomainDataAction",
          //   actionName:action.payload.actionName,
          //   objects:action.payload.objects,
          // }
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
  initialState: { Entity: getLocalCacheSliceEntityAdapter("Entity").getInitialState() },
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
export const selectInstancesForEntity: (entityName: string) => any = _memoize(
  (entityName: string) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        return state.presentModelSnapshot.miroirInstances[entityName];
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
