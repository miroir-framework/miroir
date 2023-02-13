import {
  ActionCreatorWithoutPayload,
  ActionCreatorWithPayload,
  CaseReducerActions,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityAdapter,
  EntityState,
  PayloadAction,
  Slice,
  SliceCaseReducers,
  Update
} from "@reduxjs/toolkit";
import { memoize as _memoize } from "lodash";
import { useSelector } from "react-redux";
import { DomainAction, EntityDefinition } from 'miroir-core';
import { Instance, InstanceCollection, InstanceWithName } from 'miroir-core';
import { MiroirReport } from 'miroir-core';
import { ReduxStateWithUndoRedo } from "miroir-fwk/4_services/localStore/UndoRedoReducer";

const instanceSliceName:string = "instance";
//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const instanceSliceInputActionNamesObject = {
  handleLocalCacheAction: "handleLocalCacheAction",
  // ReplaceAllInstances: "ReplaceAllInstances",
  // ReplaceInstancesForEntity: "ReplaceInstancesForEntity",
  UpdateInstancesForEntity: "UpdateInstancesForEntity",
  AddInstancesForEntity: "AddInstancesForEntity",
};
export type instanceSliceInputActionNamesObjectTuple = typeof instanceSliceInputActionNamesObject;
export type instanceSliceInputActionNamesKey = keyof instanceSliceInputActionNamesObjectTuple;
export const instanceSliceInputActionNames = Object.values(instanceSliceInputActionNamesObject);
export const instanceSliceInputFullActionNames = Object.values(instanceSliceInputActionNamesObject).map(n=>instanceSliceName+'/'+n);

export function getPromiseActionStoreActionNames(promiseActionNames:string[]):string[] {
  return promiseActionNames 
    .reduce(
      (acc:string[],curr) => acc.concat([curr,'saga-' + curr,curr+'/rejected']),[]
    )
  ;
}

export const instanceSliceGeneratedActionNames = getPromiseActionStoreActionNames(instanceSliceInputActionNames);

//#########################################################################################
//# DATA TYPES
//#########################################################################################
// instance slice state cannot really be defined statically, since it changes at run-time, depending on the set of defined instances
export interface InstanceSliceState {
  [propName: string]: EntityState<any>;
}


export type InstanceAction = PayloadAction<InstanceCollection>;

//#########################################################################################
//# Entity Adapter
//#########################################################################################
const getSliceEntityAdapter: (
  entityName: string) => EntityAdapter<Instance> = _memoize(
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

//#########################################################################################
//# REDUCER FUNCTION
//#########################################################################################
function ReplaceInstancesForEntity(state: InstanceSliceState, action: InstanceAction) {
  console.log('ReplaceInstancesForEntity', action.payload.entity,action.payload.instances);
  const sliceEntityAdapter = getSliceEntityAdapter(action.payload.entity);
  if (!state[action.payload.entity]) {
    state[action.payload.entity] = sliceEntityAdapter.getInitialState();
  }

  state[action.payload.entity] = sliceEntityAdapter.setAll(state[action.payload.entity], action.payload.instances);
}



//#########################################################################################
//# SLICE
//#########################################################################################
export const InstanceSliceObject: Slice<InstanceSliceState> = createSlice({
  name: instanceSliceName,
  initialState: { Entity: getSliceEntityAdapter("Entity").getInitialState() },
  reducers: {
    [instanceSliceInputActionNamesObject.AddInstancesForEntity](state: InstanceSliceState, action: InstanceAction) {
      const currentEntityName = action.payload.entity;
      console.log(instanceSliceInputActionNamesObject.AddInstancesForEntity, "action", JSON.stringify(action));

      action.payload.instances.forEach((instance: InstanceWithName) => {
        console.log(instanceSliceInputActionNamesObject.AddInstancesForEntity, "instance", JSON.stringify(instance));
        if (state[action.payload.entity]) {
          state[action.payload.entity] = getSliceEntityAdapter(currentEntityName).addOne(
            state[currentEntityName],
            instance
          );
        } else {
          state[action.payload.entity] = getSliceEntityAdapter(currentEntityName).addOne(
            getSliceEntityAdapter(currentEntityName).getInitialState(),
            instance
          );
        }
      });
      if (action.payload.entity === "Entity") {
        //check if entity already exists in store, and if not initialize store state for it.
        action.payload.instances
          .filter((e) => e['name'] !== "Entity")
          .forEach((entity: InstanceWithName) => {
            console.log(instanceSliceInputActionNamesObject.AddInstancesForEntity, "initializing entity", entity.name);
            state[entity.name] = getSliceEntityAdapter(entity.name).getInitialState();
          });
      }
    },
    [instanceSliceInputActionNamesObject.UpdateInstancesForEntity](state: InstanceSliceState, action: InstanceAction) {
      console.log(instanceSliceInputActionNamesObject.UpdateInstancesForEntity, state, action);
      // TODO: replace implementation with updateMany
      action.payload.instances.forEach((instance: InstanceWithName) => {
        // state[action.payload.entity][instance.uuid] = instance;
        const entityUpdate: Update<Instance> = { id: instance.uuid, changes: instance };

        getSliceEntityAdapter(action.payload.entity).updateOne(state[action.payload.entity], entityUpdate);
      });
    },
    // [instanceSliceInputActionNamesObject.ReplaceInstancesForEntity](state: InstanceSliceState, action: InstanceAction) {
    //   ReplaceInstancesForEntity(state,action)
    // },
    // [instanceSliceInputActionNamesObject.ReplaceAllInstances](state: InstanceSliceState, action: PayloadAction<InstanceCollection[]>) {
    //   console.log(instanceSliceInputActionNamesObject.ReplaceAllInstances, action.payload,InstanceSliceObject);
    //   action.payload.forEach(
    //     function (a:InstanceCollection) {
    //       ReplaceInstancesForEntity(state,{type:"ReplaceInstancesForEntity",payload:a} as InstanceAction)
    //     },this
    //   );
    // },
    [instanceSliceInputActionNamesObject.handleLocalCacheAction](state: InstanceSliceState, action: PayloadAction<DomainAction>) {
      console.log(instanceSliceInputActionNamesObject.handleLocalCacheAction, action.payload);
      switch (action.payload.actionName) {
        case 'replace': {
          for (let instanceCollection of action.payload.objects) {
            ReplaceInstancesForEntity(state,{type:"ReplaceInstancesForEntity",payload:instanceCollection} as InstanceAction);
          }
          break;
        }
      }
    },
  },
});

//#########################################################################################
//# SELECTORS
//#########################################################################################
export const selectMiroirEntityInstances = createSelector(
  (state: InstanceSliceState) => state,
  (items) => items
);

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
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
export function useLocalStoreEntities():EntityDefinition[] {
  const miroirEntitiesState:EntityState<EntityDefinition> = useSelector(selectInstancesForEntity('Entity'));
  return miroirEntitiesState?.entities?Object.values(miroirEntitiesState.entities):[];
}

//#########################################################################################
export function useLocalStoreReports():MiroirReport[] {
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity('Report'))
  const miroirReports:MiroirReport[] = miroirReportsState?.entities?Object.values(miroirReportsState.entities):[];
  return miroirReports;
}

//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
// export const mInstanceSliceActionsCreators:{[actionCreatorName:string]:any} = {
type InstanceSliceActionCreator<P> =
  | ActionCreatorWithPayload<P, `${string}/${string}`>
  | ActionCreatorWithoutPayload<`${string}/${string}`>
;

const actionsCreators: {
  [actionCreatorName: string]: InstanceSliceActionCreator<any>;
} = {
  ...InstanceSliceObject.actions,
};

export const InstanceSlice = {
  reducer: InstanceSliceObject.reducer,
  actionCreators: actionsCreators,
  inputActionNames: instanceSliceInputActionNamesObject,
};

export default {};
