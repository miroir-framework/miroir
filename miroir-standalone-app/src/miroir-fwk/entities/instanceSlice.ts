import { createSelector, createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import { memoize as _memoize } from 'lodash';
import { MReduxStateWithUndoRedo } from 'src/miroir-fwk/state/undoableReducer';
import { MiroirEntityInstanceWithName } from './Instance';
import { MinstanceAction } from './Mslice';

//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const mInstanceSliceStoreActionNames = {
  storeInstancesReceivedFromAPIForEntity:"storeInstancesReceivedFromAPIForEntity",
  updateEntityInstances:"updateEntityInstances",
}


//#########################################################################################
//# SLICE
//#########################################################################################
export const InstanceSlice:Slice = createSlice(
  {
    name: 'instance',
    initialState: {},
    reducers: {
      [mInstanceSliceStoreActionNames.updateEntityInstances] (state:any, action:PayloadAction<MinstanceAction,string>) {
        console.log(mInstanceSliceStoreActionNames.updateEntityInstances, state, action)
        action.payload.instances.forEach(
          (instance:MiroirEntityInstanceWithName) => {
            const instanceId:number = state[action.payload.entity].find((i:MiroirEntityInstanceWithName)=>i.uuid === instance.uuid);
            state[action.payload.entity][instanceId] = instance;
          }
        );
      },
      [mInstanceSliceStoreActionNames.storeInstancesReceivedFromAPIForEntity] (state:any, action:PayloadAction<MinstanceAction,string>) {
        // console.log(mInstanceSliceStoreActionNames.storeInstancesReceivedFromAPIForEntity, JSON.stringify(state), action)
        state[action.payload.entity] = action.payload.instances;
      },
    },
  }
)


export const selectMiroirEntityInstances = createSelector((state:any) => state, items=>items)

// const entitySelectors:Map<string,any> = new Map();
export const selectInstancesForEntity = _memoize(
  (entityName:string)=>{
    console.log('creating selectInstancesForEntity',entityName,'selector.');
    return createSelector(
    (state:MReduxStateWithUndoRedo) => {
      // console.log('selectInstancesForEntity',entityName,'selector', state);
      return state.presentModelSnapshot.miroirInstances[entityName];
    }, 
    items=>items
    )
  }
);

export default InstanceSlice;