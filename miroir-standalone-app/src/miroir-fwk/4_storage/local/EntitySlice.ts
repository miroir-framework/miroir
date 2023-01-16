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
import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";

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

export const entitySlicePromiseAction = promiseActionFactory<EntityDefinition[]>().create<EntityDefinition[]>(entitySliceInputActionNamesObject.replaceAllEntityDefinitions);

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
  name: sliceName,
  initialState: mEntityAdapter.getInitialState(),
  reducers: {
    ...(<EntityStateAdapter<EntityDefinition>>mEntityAdapter),
    [entitySliceInputActionNamesObject.replaceAllEntityDefinitions](
      state: EntitySliceStateType,
      action: EntityAction
    ) {
      console.log("reducer ",entitySliceInputActionNamesObject.replaceAllEntityDefinitions,"called", action);
      mEntityAdapter.setAll(state, action.payload);
      return state;
    },
  },
});

//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
export const entitySliceActionsCreators: any = {
  ...EntitySlice.actions,
  ['saga-'+entitySliceInputActionNamesObject.replaceAllEntityDefinitions]:(action)=>entitySlicePromiseAction(action),
};

export const selectEntityDefinitions:(state: EntitySliceStateType) => EntityDefinition[] = createSelector(
  (state: EntitySliceStateType) => state,
  (items) => Array.from(Object.values(items.entities))
);

const entitySliceObject = {
  reducer: EntitySlice.reducer,
  actionCreators: entitySliceActionsCreators,
  inputActionNames: entitySliceInputActionNamesObject,
};

export default entitySliceObject;
