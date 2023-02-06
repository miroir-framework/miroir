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
import { promiseActionFactory } from "@teroneko/redux-saga-promise";
import { EntityDefinition } from 'miroir-core';
import { StoreReturnType } from 'miroir-core';

const sliceName = 'entities';
//#########################################################################################
//# ACTION NAMES
//#########################################################################################
export const entitySliceInputActionNamesObject = {
  replaceAllEntityDefinitions: "replaceAllEntityDefinitions",
  addOne: "addOne",
  updateOne: "updateOne",
};
export const entitySliceInputFullActionNames = Object.values(entitySliceInputActionNamesObject).map(n=>sliceName+'/'+n);
export const entitySliceInputActionNames = Object.values(entitySliceInputActionNamesObject);

export const entitySliceOutputActionNames = {
  entitiesReceivedNotification: "entitiesReceivedNotification",
};

export const entitySlicePromiseAction = promiseActionFactory<StoreReturnType>().create<EntityDefinition[]>(entitySliceInputActionNamesObject.replaceAllEntityDefinitions);

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
const EntitySliceObject: Slice = createSlice({
  name: sliceName,
  initialState: mEntityAdapter.getInitialState(),
  reducers: {
    ...(<EntityStateAdapter<EntityDefinition>>mEntityAdapter),
    [entitySliceInputActionNamesObject.replaceAllEntityDefinitions](
      state: EntitySliceStateType,
      action: EntityAction
    ) {
      console.log("reducer ",entitySliceInputActionNamesObject.replaceAllEntityDefinitions,"called", action);
      state = mEntityAdapter.setAll(state, action.payload);
      return state;
    },
  },
});

//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
export const entitySliceActionsCreators: any = {
  ...EntitySliceObject.actions,
};

export const selectEntityDefinitions:(state: EntitySliceStateType) => EntityDefinition[] = createSelector(
  (state: EntitySliceStateType) => state,
  (items) => Array.from(Object.values(items.entities))
);


export const EntitySlice = {
  reducer: EntitySliceObject.reducer,
  actionCreators: entitySliceActionsCreators,
  inputActionNames: entitySliceInputActionNamesObject,
};

export default {};
