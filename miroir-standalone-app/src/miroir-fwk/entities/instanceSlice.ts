import { createEntityAdapter, createSelector, createSlice, EntityAdapter, EntityState, PayloadAction, Selector, Slice } from '@reduxjs/toolkit';
import { memoize as _memoize } from 'lodash';
import { MReduxStateWithUndoRedo } from 'src/miroir-fwk/state/undoableReducer';
import { MinstanceWithName } from './Instance';
import { MinstanceAction } from './Mslice';

//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const mInstanceSliceStoreActionNames = {
  storeInstancesReceivedFromAPIForEntity:"storeInstancesReceivedFromAPIForEntity",
  updateEntityInstances:"updateEntityInstances",
  addEntityInstances:"addEntityInstances",
}

// instance slice state cannot really be defined statically, since it changes at run-time, depending on the set of defined instances  
export interface MinstanceSliceState {
  [propName: string]: EntityState<any>;
}

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
    // initialState: {Entity:{ids:[], entities:[]}},
    initialState: {Entity:getEntityAdapter("Entity").getInitialState()},
    reducers: {
      [mInstanceSliceStoreActionNames.addEntityInstances] (
        state:MinstanceSliceState, 
        action:PayloadAction<MinstanceAction,string>
      ) {
        const currentEntityName = action.payload.entity;
        console.log(mInstanceSliceStoreActionNames.addEntityInstances, "action", JSON.stringify(action))

        action.payload.instances.forEach(
          (instance:MinstanceWithName) => {
            console.log(mInstanceSliceStoreActionNames.addEntityInstances, "instance", JSON.stringify(instance))
            if (state[action.payload.entity]){
              state[action.payload.entity] = getEntityAdapter(currentEntityName).addOne(state[currentEntityName],instance);
            } else {
              state[action.payload.entity] = getEntityAdapter(currentEntityName).addOne(getEntityAdapter(currentEntityName).getInitialState(),instance);
            }
          }
        );
      },
      [mInstanceSliceStoreActionNames.updateEntityInstances] (
        state:MinstanceSliceState, 
        action:PayloadAction<MinstanceAction,string>
      ) {
        console.log(mInstanceSliceStoreActionNames.updateEntityInstances, state, action)
        action.payload.instances.forEach(
          (instance:MinstanceWithName) => {
            // state[action.payload.entity][instance.uuid] = instance;
            getEntityAdapter(action.payload.entity).addOne(state[action.payload.entity], instance);
          }
        );
      },
      [mInstanceSliceStoreActionNames.storeInstancesReceivedFromAPIForEntity] (
        state:MinstanceSliceState, 
        action:PayloadAction<MinstanceAction,string>
      ) {
        console.log(mInstanceSliceStoreActionNames.storeInstancesReceivedFromAPIForEntity, JSON.stringify(state), action)
        // getEntityAdapter(action.payload.entity).removeAll();
        getEntityAdapter(action.payload.entity).setAll(state[action.payload.entity], action.payload.instances);
        if (action.payload.entity === "Entity") {
          action.payload.instances.filter(e=>e.name!=="Entity").forEach(
            (entity:MinstanceWithName) => {
              console.log(mInstanceSliceStoreActionNames.storeInstancesReceivedFromAPIForEntity, "initializing entity",entity.name);
              state[entity.name] = getEntityAdapter(entity.name).getInitialState();
            }
          )
        }
      },
    },
  }
)


export const selectMiroirEntityInstances = createSelector((state:MinstanceSliceState) => state, items=>items)

// const entitySelectors:Map<string,any> = new Map();
// export const selectInstancesForEntity:(entityName:string)=>Selector<MReduxStateWithUndoRedo,MinstanceWithName[]> = _memoize(
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
export const selectInstancesForEntity:(entityName:string)=>any = _memoize(
  (entityName:string)=>{
    console.log('creating selectInstancesForEntity',entityName,'selector.');
    return (
      createSelector(
        (state:MReduxStateWithUndoRedo) => {
          console.log('selectInstancesForEntity',entityName,'selector', state);
          const entitiesObject = state.presentModelSnapshot.miroirInstances[entityName]?.entities;
          return entitiesObject?Object.values(entitiesObject):[];
        },
        items=>items
      )
    )
  }
);

export const MinstanceActionsCreators:any = {
  ...InstanceSlice.actions
}


export default InstanceSlice;