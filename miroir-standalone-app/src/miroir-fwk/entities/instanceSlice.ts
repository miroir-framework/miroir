import { createAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import { client } from '../../api/client';
import { RootState } from '../state/store';
import { MiroirEntities, MiroirEntity } from './Entity';
import { miroirEntitySagaActionNames } from './entitySlice';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

interface StoreContentsType {
  entity:string;
  entities:any[];
}
interface PayloadType {
  type: string;
  payload: StoreContentsType;
}

export const miroirInstanceSagaActionNames = {
  fetchMiroirEntityInstances:  "instances/fetchMiroirEntityInstances",
  refreshMiroirEntityInstances:  "instances/refreshMiroirEntityInstances",
}

export const miroirInstanceSliceActionNames = {
  instancesReceived:"instance/instancesReceived",
}


export const miroirInstanceActionsCreators = {
  fetchMiroirInstances: createAction<string|undefined>(miroirInstanceSagaActionNames.fetchMiroirEntityInstances),
  refreshMiroirInstances: createAction<MiroirEntities>(miroirInstanceSagaActionNames.refreshMiroirEntityInstances),
  instancesReceived: createAction<StoreContentsType>(miroirInstanceSliceActionNames.instancesReceived),
}



export const selectMiroirEntityInstances = createSelector((state:any) => state, items=>items)

const miroirInstanceSlice = createSlice(
  {
    name: 'instance',
    initialState: {},
    reducers: {
      // instanceAdded: miroirInstanceAdapter.addOne,
      instancesReceived(state:RootState, action:PayloadType) {
        console.log("instancesReceived: entities", JSON.stringify(state), action)
        // console.log("instancesReceived: entities", selectAllMiroirEntitiesForReduce(state), state, action)
        state[action.payload.entity] = action.payload.entities;
      },
    },
  }
)

export function* fetchMiroirInstanceGen(args:{type:string, payload:string}):any {
  console.log("fetchMiroirInstanceGen", args)
  try {
    let result:{
      status: number;
      data: any;
      headers: Headers;
      url: string;
  } = yield call(
      () => client.get('/fakeApi/'+args.payload+ '/all')
    )
    yield put(miroirInstanceActionsCreators.instancesReceived({entities:result.data, entity:args.payload}));
  } catch (e) {
    yield put({ type: 'instance/failure/instancesNotReceived' })
  }
}

export function* refreshMiroirEntityInstances(args:{type:string, payload:MiroirEntities}):any {
  console.log("refreshMiroirEntityInstances launched", args)
  try {
    yield all(
      args.payload.map((e:MiroirEntity) => put(miroirInstanceActionsCreators.fetchMiroirInstances(e.name)))
    )
  } catch (error) {
    console.log("refreshMiroirEntityInstances error",error)
  } finally {
    console.log("refreshMiroirEntityInstances finished")
  }

}


export function* instanceRootSaga() {
  yield all(
    [
      takeEvery(miroirEntitySagaActionNames.entitiesReceivedSaga, refreshMiroirEntityInstances),
      takeEvery(miroirInstanceSagaActionNames.refreshMiroirEntityInstances, refreshMiroirEntityInstances),
      takeEvery(miroirInstanceSagaActionNames.fetchMiroirEntityInstances, fetchMiroirInstanceGen),
    ]
  )
}

export default miroirInstanceSlice.reducer;