import { createAction, createEntityAdapter, createSlice, EntityAdapter, Slice } from '@reduxjs/toolkit';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import { client } from '../../api/client';
import { MiroirEntity } from './Entity';


export const miroirEntitiesAdapter: EntityAdapter<MiroirEntity> = createEntityAdapter<MiroirEntity>(
  {
    // Assume IDs are stored in a field other than `book.id`
    selectId: (entity) => entity.uuid,
    // Keep the "all IDs" array sorted based on book titles
    sortComparer: (a, b) => a.name.localeCompare(b.name),
  }
)

export const miroirEntitySliceActionNames = {
  entitiesReceived:"entitiesReceived",
}

export const miroirEntitySagaActionNames = {
  fetchMiroirEntities:"entities/fetchMiroirEntities",
  entitiesReceivedSaga:"entitiesReceivedSaga",
}

export const miroirEntitiesSlice:Slice = createSlice(
  {
    name: 'entities',
    initialState: miroirEntitiesAdapter.getInitialState(),
    reducers: {
      entityAdded: miroirEntitiesAdapter.addOne,
      [miroirEntitySliceActionNames.entitiesReceived](state, action:any) {
        console.log("entitiesReceived", action)
        miroirEntitiesAdapter.setAll(state, action.payload);
        action['asyncDispatch'](miroirEntityActionsCreators[miroirEntitySagaActionNames.entitiesReceivedSaga](action.payload))
      },
    },
  }
)


export const miroirEntityActionsCreators:any = {
  fetchMiroirEntities:createAction(miroirEntitySagaActionNames.fetchMiroirEntities),
  entitiesReceivedSaga:createAction(miroirEntitySagaActionNames.entitiesReceivedSaga),
  ...miroirEntitiesSlice.actions
  
}

console.log('miroirEntityActionsCreators',miroirEntityActionsCreators)


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
    yield put(miroirEntityActionsCreators[miroirEntitySliceActionNames.entitiesReceived](result.data))
  } catch (e) {
    yield put({ type: 'entities/failure/entitiesNotReceived' })
  }}

export function* entityRootSaga() {
  yield all([
    takeEvery(miroirEntitySagaActionNames.fetchMiroirEntities, fetchMiroirEntitiesGen),
  ])
}


export default miroirEntitiesSlice.reducer