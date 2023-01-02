import { createEntityAdapter, createSlice, EntityAdapter, EntityState, PayloadAction, Slice } from '@reduxjs/toolkit';
import { MiroirEntities, MiroirEntity } from './Entity';


//#########################################################################################
//# ACTION NAMES
//#########################################################################################
export const mEntitySliceStoreActionNames = {
  storeEntities:"storeEntities",
  addOne:"addOne",
  updateOne:"updateOne",
}

export const mEntitySliceActionNames = {
  entitiesReceivedNotification:"entitiesReceivedNotification",
}

//#########################################################################################
//# ENTITY ADAPTER
//#########################################################################################
export const mEntityAdapter: EntityAdapter<MiroirEntity> = createEntityAdapter<MiroirEntity>(
  {
    // Assume IDs are stored in a field other than `book.id`
    selectId: (entity) => entity.uuid,
    // Keep the "all IDs" array sorted based on book titles
    sortComparer: (a, b) => a.name.localeCompare(b.name),
  }
)

//#########################################################################################
//# SLICE
//#########################################################################################
const EntitySlice:Slice = createSlice(
  {
    name: 'entities',
    initialState: mEntityAdapter.getInitialState(),
    reducers: {
      [mEntitySliceStoreActionNames.addOne]: mEntityAdapter.addOne,
      [mEntitySliceStoreActionNames.updateOne]: mEntityAdapter.updateOne,
      // [mEntitySliceStoreActionNames.addEntities](
      //   state:EntityState<MiroirEntity>, 
      //   action:any
      // ) {
      //   return mEntityAdapter.addOne(state, action)
      // },
      [mEntitySliceStoreActionNames.storeEntities](
        state:EntityState<MiroirEntity>, 
        action:PayloadAction<MiroirEntities,string>
      ) {
        console.log("reducer storeEtities called", action, JSON.stringify(state))
        mEntityAdapter.setAll(state, action.payload);
        return state;
      },
    },
  }
);

export const mEntityActionsCreators:any = {
  ...EntitySlice.actions
}


export default EntitySlice;