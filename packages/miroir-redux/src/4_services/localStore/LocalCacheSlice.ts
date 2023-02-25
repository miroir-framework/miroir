import {
  ActionCreatorWithoutPayload,
  ActionCreatorWithPayload, createEntityAdapter,
  createSelector,
  createSlice,
  EntityAdapter,
  EntityState,
  PayloadAction,
  Slice
} from "@reduxjs/toolkit";
import { memoize as _memoize } from "lodash";
import { DomainStateSelector, Instance, InstanceCollection, LocalCacheAction } from 'miroir-core';
import { ReduxStateWithUndoRedo } from "src/4_services/localStore/LocalCacheSliceUndoRedoReducer";

export const localCacheSliceName:string = "localCache";
//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const localCacheSliceInputActionNamesObject = {
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


// export type LocalCacheAction = PayloadAction<InstanceCollection>;

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
  // if (!state[action.payload.entity]) {
  //   state[action.payload.entity] = sliceEntityAdapter.getInitialState();
  // }

  state[action.payload.entity] = sliceEntityAdapter.setAll(state[action.payload.entity], action.payload.instances);
}



//#########################################################################################
//# SLICE
//#########################################################################################
export const localCacheSliceObject: Slice<LocalCacheSliceState> = createSlice({
  name: localCacheSliceName,
  initialState: { Entity: getLocalCacheSliceEntityAdapter("Entity").getInitialState() },
  reducers: {
    // [localCacheSliceInputActionNamesObject.AddInstancesForEntity](state: LocalCacheSliceState, action: LocalCacheAction) {
    //   const currentEntityName = action.payload.entity;
    //   console.log(localCacheSliceInputActionNamesObject.AddInstancesForEntity, "action", JSON.stringify(action));

    //   action.payload.instances.forEach((instance: InstanceWithName) => {
    //     console.log(localCacheSliceInputActionNamesObject.AddInstancesForEntity, "instance", JSON.stringify(instance));
    //     if (state[action.payload.entity]) {
    //       state[action.payload.entity] = getLocalCacheSliceEntityAdapter(currentEntityName).addOne(
    //         state[currentEntityName],
    //         instance
    //       );
    //     } else {
    //       state[action.payload.entity] = getLocalCacheSliceEntityAdapter(currentEntityName).addOne(
    //         getLocalCacheSliceEntityAdapter(currentEntityName).getInitialState(),
    //         instance
    //       );
    //     }
    //   });
    //   if (action.payload.entity === "Entity") {
    //     //check if entity already exists in store, and if not initialize store state for it.
    //     action.payload.instances
    //       .filter((e) => e['name'] !== "Entity")
    //       .forEach((entity: InstanceWithName) => {
    //         console.log(localCacheSliceInputActionNamesObject.AddInstancesForEntity, "initializing entity", entity.name);
    //         state[entity.name] = getLocalCacheSliceEntityAdapter(entity.name).getInitialState();
    //       });
    //   }
    // },
    // [localCacheSliceInputActionNamesObject.UpdateInstancesForEntity](state: LocalCacheSliceState, action: LocalCacheAction) {
    //   console.log(localCacheSliceInputActionNamesObject.UpdateInstancesForEntity, state, action);
    //   // TODO: replace implementation with updateMany
    //   action.payload.instances.forEach((instance: InstanceWithName) => {
    //     // state[action.payload.entity][instance.uuid] = instance;
    //     const entityUpdate: Update<Instance> = { id: instance.uuid, changes: instance };

    //     getLocalCacheSliceEntityAdapter(action.payload.entity).updateOne(state[action.payload.entity], entityUpdate);
    //   });
    // },
    [localCacheSliceInputActionNamesObject.handleLocalCacheAction](state: LocalCacheSliceState, action: PayloadAction<LocalCacheAction>) {
      console.log('localCacheSliceObject',localCacheSliceInputActionNamesObject.handleLocalCacheAction, 'called',action);
      switch (action.payload.actionName) {
        case 'replace': {
          for (let instanceCollection of action.payload.objects) {
            ReplaceInstancesForEntity(state,{type:"ReplaceInstancesForEntity",payload:instanceCollection} as PayloadAction<InstanceCollection>);
          }
          break;
        }
        case 'create': {
          for (let instanceCollection of action.payload.objects) {
            const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entity, state);
            sliceEntityAdapter.addMany(state[instanceCollection.entity], instanceCollection.instances)
          }
          break;
        }
        case 'delete': {
          for (let instanceCollection of action.payload.objects) {
            const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entity, state);
            sliceEntityAdapter.removeMany(state[instanceCollection.entity], action.payload.uuid?[action.payload.uuid]:instanceCollection.instances.map(i=>i.uuid))
          }
          break;
        }
        case 'update': {
          for (let instanceCollection of action.payload.objects) {
            const sliceEntityAdapter = getInitializedEntityAdapter(instanceCollection.entity, state);
            sliceEntityAdapter.updateMany(state[instanceCollection.entity], instanceCollection.instances.map(i=>({ id: i.uuid, changes: i })))
            // getSliceEntityAdapter(action.payload.entity).updateOne(state[action.payload.entity], entityUpdate);
          }
          break;
        }
        default:
          console.warn('handleLocalCacheAction action could not be taken into account, unkown action', action.payload.actionName)
      }
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
export const selectInstancesFromDomainSelector: (selector:DomainStateSelector) => any = 
  // _memoize(
    // (entityName: string) => {
  (selector:DomainStateSelector) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        return selector(Object.fromEntries(Object.entries(state.presentModelSnapshot.miroirInstances).map(e=>[e[0],Object.values(e[1].entities)])));
      },
      (items: Instance[]) => items
    );
  }
    // }
  // )
;


//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
// export const mInstanceSliceActionsCreators:{[actionCreatorName:string]:any} = {
type LocalCacheSliceActionCreator<P> =
  | ActionCreatorWithPayload<P, `${string}/${string}`>
  | ActionCreatorWithoutPayload<`${string}/${string}`>
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
