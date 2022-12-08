import { createAction, createEntityAdapter, createSlice, EntityAdapter, Slice } from '@reduxjs/toolkit';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import { client } from '../../api/client';
import { MiroirEntities, MiroirEntity } from './Entity';

//#########################################################################################
//# DATA TYPES
//#########################################################################################
export interface MactionWithAsyncDispatchType {
  type: string;
  asyncDispatch:(asyncAction:any) => void; // brought by asyncDispatchMiddleware
}

declare type MentitySliceStateType = MiroirEntities;
interface MentitySliceActionPayloadType extends MactionWithAsyncDispatchType{
  payload: MentitySliceStateType;
}


//#########################################################################################
//# ENTITY ADAPTER
//#########################################################################################
export const mEntitiesAdapter: EntityAdapter<MiroirEntity> = createEntityAdapter<MiroirEntity>(
  {
    // Assume IDs are stored in a field other than `book.id`
    selectId: (entity) => entity.uuid,
    // Keep the "all IDs" array sorted based on book titles
    sortComparer: (a, b) => a.name.localeCompare(b.name),
  }
)

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
const mEntitySliceStoreActionNames = {
  entitiesReceived:"entitiesReceived",
}

const mEntitySliceSagaActionNames = {
  fetchMiroirEntities:"entities/fetchMiroirEntities",
}

export const mEntitySliceActionNames = {
  entitiesReceivedNotification:"entitySlice/entitiesReceivedNotification",
}

//#########################################################################################
//# SLICE
//#########################################################################################
export const mEntitiesSlice:Slice = createSlice(
  {
    name: 'entities',
    initialState: mEntitiesAdapter.getInitialState(),
    reducers: {
      entityAdded: mEntitiesAdapter.addOne,
      [mEntitySliceStoreActionNames.entitiesReceived](state, action:MentitySliceActionPayloadType) {
        console.log("entitiesReceived", state, action)
        mEntitiesAdapter.setAll(state, action.payload);
        action.asyncDispatch(mEntityActionsCreators.entitiesReceivedNotification(action.payload))
      },
    },
  }
)

//#########################################################################################
//# ACTION DEFINITIONS
//#########################################################################################
export const mEntityActionsCreators:any = {
  fetchMiroirEntities:createAction(mEntitySliceSagaActionNames.fetchMiroirEntities),
  entitiesReceivedNotification:createAction(mEntitySliceActionNames.entitiesReceivedNotification),
  ...mEntitiesSlice.actions
}

//#########################################################################################
//# SAGAS
//#########################################################################################
function* fetchMiroirEntitiesGen():any {
  console.log("fetchMiroirEntitiesGen")
  try {
    const result:{
      status: number;
      data: any;
      headers: Headers;
      url: string;
    } = yield call(
      () => client.get('/fakeApi/Entity/all')
    )
    yield put(mEntityActionsCreators[mEntitySliceStoreActionNames.entitiesReceived](result.data))
  } catch (e) {
    yield put({ type: 'entities/failure/entitiesNotReceived' })
  }}

export function* entityRootSaga() {
  yield all([
    takeEvery(mEntitySliceSagaActionNames.fetchMiroirEntities, fetchMiroirEntitiesGen),
  ])
}


export default mEntitiesSlice.reducer