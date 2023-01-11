import { ActionCreatorWithoutPayload, ActionCreatorWithPayload, createEntityAdapter, createSelector, createSlice, EntityAdapter, EntityState, PayloadAction, Slice, Update } from '@reduxjs/toolkit';
import { memoize as _memoize } from 'lodash';
import { MreduxWithUndoRedoState } from 'src/miroir-fwk/4_storage/local/undoableReducer';
import { Minstance, MinstanceWithName } from 'src/miroir-fwk/0_interfaces/1_core/Instance';

//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const mInstanceSliceInputActionNames = {
  ReplaceInstancesForEntity:"ReplaceInstancesForEntity",
  UpdateInstancesForEntity:"UpdateInstancesForEntity",
  AddInstancesForEntity:"AddInstancesForEntity",
}

//#########################################################################################
//# DATA TYPES
//#########################################################################################
// instance slice state cannot really be defined statically, since it changes at run-time, depending on the set of defined instances  
export interface InstanceSliceState {
  [propName: string]: EntityState<any>;
}

export interface InstanceActionPayload {
  entity:string, instances:MinstanceWithName[]
}

export type InstanceAction = PayloadAction<InstanceActionPayload>;

//#########################################################################################
//# INTERNAL
//#########################################################################################
const getEntityAdapter:(entityName:string)=>EntityAdapter<MinstanceWithName> = _memoize(
  (entityName:string)=>{
    console.log('getEntityAdapter creating EntityAdapter For Entity',entityName);
    return createEntityAdapter<MinstanceWithName>(
      {
        // Assume IDs are stored in a field other than `book.id`
        selectId: (entity) => entity.uuid,
        // Keep the "all IDs" array sorted based on book titles
        sortComparer: (a, b) => a.name.localeCompare(b.name),
      }
    );
  }
);

//#########################################################################################
//# SLICE
//#########################################################################################
export const InstanceSlice:Slice = createSlice(
  {
    name: 'instance',
    initialState: {Entity:getEntityAdapter("Entity").getInitialState()},
    reducers: {
      [mInstanceSliceInputActionNames.AddInstancesForEntity] (
        state:InstanceSliceState, 
        action:InstanceAction
      ) {
        const currentEntityName = action.payload.entity;
        console.log(mInstanceSliceInputActionNames.AddInstancesForEntity, "action", JSON.stringify(action))

        action.payload.instances.forEach(
          (instance:MinstanceWithName) => {
            console.log(mInstanceSliceInputActionNames.AddInstancesForEntity, "instance", JSON.stringify(instance))
            if (state[action.payload.entity]){
              state[action.payload.entity] = getEntityAdapter(currentEntityName).addOne(state[currentEntityName],instance);
            } else {
              state[action.payload.entity] = getEntityAdapter(currentEntityName).addOne(getEntityAdapter(currentEntityName).getInitialState(),instance);
            }
          }
        );
        if (action.payload.entity === "Entity") {//check if entity already exists in store, and if not initialize store state for it.
          action.payload.instances.filter(e=>e.name!=="Entity").forEach(
            (entity:MinstanceWithName) => { console.log(mInstanceSliceInputActionNames.ReplaceInstancesForEntity, "initializing entity",entity.name);
              state[entity.name] = getEntityAdapter(entity.name).getInitialState();
            }
          )
        }
      },
      [mInstanceSliceInputActionNames.UpdateInstancesForEntity] (
        state:InstanceSliceState, 
        action:InstanceAction
      ) {
        console.log(mInstanceSliceInputActionNames.UpdateInstancesForEntity, state, action)
        // TODO: replace implementation with updateMany
        action.payload.instances.forEach(
          (instance:MinstanceWithName) => {
            // state[action.payload.entity][instance.uuid] = instance;
            const entityUpdate:Update<Minstance> = {id:instance.uuid, changes: instance};

            getEntityAdapter(action.payload.entity).updateOne(state[action.payload.entity], entityUpdate);
          }
        );
      },
      [mInstanceSliceInputActionNames.ReplaceInstancesForEntity] (
        state:InstanceSliceState, 
        action:InstanceAction
      ) {
        console.log(mInstanceSliceInputActionNames.ReplaceInstancesForEntity, JSON.stringify(state), action)
        // getEntityAdapter(action.payload.entity).removeAll();
        getEntityAdapter(action.payload.entity).setAll(state[action.payload.entity], action.payload.instances);
        //TODO: find a better solution!!!!!
        if (action.payload.entity === "Entity") {//check if entity already exists in store, and if not initialize store state for it.
          action.payload.instances.filter(e=>e.name!=="Entity").forEach(
            (entity:MinstanceWithName) => { console.log(mInstanceSliceInputActionNames.ReplaceInstancesForEntity, "initializing entity",entity.name);
              state[entity.name] = getEntityAdapter(entity.name).getInitialState();
            }
          )
        }
      },
    },
  }
)


//#########################################################################################
//# SELECTORS
//#########################################################################################
export const selectMiroirEntityInstances = createSelector((state:InstanceSliceState) => state, items=>items)

// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
export const selectInstancesForEntity:(entityName:string)=>any = _memoize(
  (entityName:string)=>{
    console.log('creating selectInstancesForEntity',entityName,'selector.');
    return (
      createSelector(
        (state:MreduxWithUndoRedoState) => {
          console.log('selectInstancesForEntity',entityName,'state', state);
          return state.presentModelSnapshot.miroirInstances[entityName];
        },
        (items:EntityState<any>)=>items
      )
    )
  }
);

//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
// export const mInstanceSliceActionsCreators:{[actionCreatorName:string]:any} = {
export type InstanceSliceActionCreator = ActionCreatorWithPayload<any, `${string}/${string}`> | ActionCreatorWithoutPayload<`${string}/${string}`>;
export const actionsCreators: {
  [actionCreatorName:string]:InstanceSliceActionCreator
} = {
  ...InstanceSlice.actions
}

const instanceSliceObject = {
  reducer: InstanceSlice.reducer,
  actionCreators: actionsCreators,
  inputActionNames: mInstanceSliceInputActionNames,
}

export default instanceSliceObject;