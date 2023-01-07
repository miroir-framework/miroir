import { createEntityAdapter, createSlice, EntityAdapter, EntityState, EntityStateAdapter, PayloadAction, Slice } from '@reduxjs/toolkit';
import { MdomainEntityInputActionsI, MreduxStore } from '../domain/store';
import { mEntities, Mentity } from './Entity';


//#########################################################################################
//# ACTION NAMES
//#########################################################################################
export const mEntitySliceInputActionNames = {
  replaceEntities:"replaceEntities",
  addOne:"addOne",
  updateOne:"updateOne",
}

export const mEntitySliceOutputActionNames = {
  entitiesReceivedNotification:"entitiesReceivedNotification",
}

//#########################################################################################
//# ENTITY ADAPTER
//#########################################################################################
export class MEntitySlice implements MdomainEntityInputActionsI {
  constructor (private store:MreduxStore) {}
  // public addInstancesForEntity(entityName:string,instances:Minstance[]):void {

  // };
  // public modifyInstancesForEntity(entityName:string,instances:Minstance[]):void {

  // };
  replaceEntities(entities:Mentity[]):void {
    mEntityActionsCreators[mEntitySliceInputActionNames.replaceEntities](entities);
  };

}

//#########################################################################################
//# ENTITY ADAPTER
//#########################################################################################
export const mEntityAdapter: EntityAdapter<Mentity> = createEntityAdapter<Mentity>(
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
      ...<EntityStateAdapter<Mentity>>mEntityAdapter,
      [mEntitySliceInputActionNames.replaceEntities](
        state:EntityState<Mentity>, 
        action:PayloadAction<mEntities,string>
      ) {
        console.log("reducer storeEtities called", action, JSON.stringify(state))
        mEntityAdapter.setAll(state, action.payload);
        return state;
      },
    },
  }
);

//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
export const mEntityActionsCreators:any = {
  ...EntitySlice.actions
}


export default EntitySlice;