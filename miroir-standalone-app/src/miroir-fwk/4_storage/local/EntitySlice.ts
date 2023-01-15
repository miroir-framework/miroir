import {
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityAdapter,
  EntityState,
  EntityStateAdapter,
  PayloadAction,
  Slice
} from "@reduxjs/toolkit";
import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
export const mEntitySliceInputActionNames = {
  replaceEntities: "replaceEntities",
  addOne: "addOne",
  updateOne: "updateOne",
};

export const mEntitySliceOutputActionNames = {
  entitiesReceivedNotification: "entitiesReceivedNotification",
};

//#########################################################################################
//# DATA TYPES
//#########################################################################################
export type EntitySliceStateType = EntityState<EntityDefinition>;
export type EntityActionPayload = EntityDefinition[];
export type EntityAction = PayloadAction<EntityDefinition[]>;


//#########################################################################################
//# ENTITY ADAPTER
//#########################################################################################
export const mEntityAdapter: EntityAdapter<EntityDefinition> =
  createEntityAdapter<EntityDefinition>({
    // Assume IDs are stored in a field other than `book.id`
    selectId: (entity) => entity.uuid,
    // Keep the "all IDs" array sorted based on book titles
    sortComparer: (a, b) => a.name.localeCompare(b.name),
  });

//#########################################################################################
//# SLICE
//#########################################################################################
const EntitySlice: Slice = createSlice({
  name: "entities",
  initialState: mEntityAdapter.getInitialState(),
  reducers: {
    ...(<EntityStateAdapter<EntityDefinition>>mEntityAdapter),
    [mEntitySliceInputActionNames.replaceEntities](
      state: EntitySliceStateType,
      action: EntityAction
    ) {
      console.log("reducer storeEtities called", action, JSON.stringify(state));
      mEntityAdapter.setAll(state, action.payload);
      return state;
    },
  },
});

//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
export const mEntitySliceActionsCreators: any = {
  ...EntitySlice.actions,
};

export const selectEntityDefinitions:(state: EntitySliceStateType) => EntityDefinition[] = createSelector(
  (state: EntitySliceStateType) => state,
  (items) => Array.from(Object.values(items.entities))
);

export default EntitySlice;
