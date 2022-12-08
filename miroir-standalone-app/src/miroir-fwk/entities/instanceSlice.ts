import { createAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import { client } from '../../api/client';
import { RootState } from '../state/store';
import { makeActionUpdatesUndoable } from '../state/undoableReducer';
import { MiroirEntities, MiroirEntity } from './Entity';
import { MactionWithAsyncDispatchType, mEntitySliceActionNames } from './entitySlice';
import { MiroirEntityInstanceWithName } from './Instance';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

//#########################################################################################
//# DATA TYPES
//#########################################################################################
interface MinstanceSliceStateType {
  entity:string;
  instances:MiroirEntityInstanceWithName[];
}
interface MinstanceSliceActionPayloadType extends MactionWithAsyncDispatchType{
  type: string;
  payload: MinstanceSliceStateType;
}

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
const mInstanceSliceInternalSagaActionNames = {
  fetchMiroirEntityInstances:  "instances/fetchMiroirEntityInstances",
  refreshMiroirEntityInstances:  "instances/refreshMiroirEntityInstances",
}

//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const mInstanceSliceStoreActionNames = {
  entityInstancesReceivedFromAPI:"entityInstancesReceivedFromAPI",
  updateEntityInstances:"updateEntityInstances",
}

//#########################################################################################
// events sent by the InstanceSlice, that can be intercepted and acted upon by the outside world
export const mInstanceSliceActionNames = {
  entityInstancesRefreshed:  "instances/entityInstancesRefreshed",
}

//#########################################################################################
//# SLICE
//#########################################################################################
const mInstanceSlice = createSlice(
  {
    name: 'instance',
    initialState: {},
    reducers: {
      [mInstanceSliceStoreActionNames.updateEntityInstances] (state:RootState, action:MinstanceSliceActionPayloadType) {
        console.log(mInstanceSliceStoreActionNames.updateEntityInstances, state, action)
        action.payload.instances.forEach(
          (instance:MiroirEntityInstanceWithName) => {
            const instanceId:number = state[action.payload.entity].find((i:MiroirEntityInstanceWithName)=>i.uuid === instance.uuid);
            state[action.payload.entity][instanceId] = instance;
          }
        );
      },
      [mInstanceSliceStoreActionNames.entityInstancesReceivedFromAPI] (state:RootState, action:MinstanceSliceActionPayloadType) {
        console.log(mInstanceSliceStoreActionNames.entityInstancesReceivedFromAPI, JSON.stringify(state), action)
        state[action.payload.entity] = action.payload.instances;
      },
    },
  }
)


//#########################################################################################
//# ACTIONS
//#########################################################################################
// actions sent by the InstanceSlice, to itself or to the oustide world.
const mInstanceSliceInternalActionsCreators:any = {
  ...mInstanceSlice.actions,
  fetchMiroirEntityInstances: createAction<string|undefined>(mInstanceSliceInternalSagaActionNames.fetchMiroirEntityInstances),
  entityInstancesRefreshed: createAction<string[]>(mInstanceSliceActionNames.entityInstancesRefreshed),
}

//#########################################################################################
// notify the undoableReducer
makeActionUpdatesUndoable(mInstanceSliceStoreActionNames.updateEntityInstances);

//#########################################################################################
// interface of events creators allowing the outside world to send events to the InstanceSlice.
export const mInstanceSliceActionsCreators = {
  refreshMiroirInstances: createAction<MiroirEntities>(mInstanceSliceInternalSagaActionNames.refreshMiroirEntityInstances),
}

//#########################################################################################
//# SELECTORS
//#########################################################################################
export const selectMiroirEntityInstances = createSelector((state:any) => state, items=>items)


//#########################################################################################
//# SAGAS
//#########################################################################################
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
    yield put(
      mInstanceSliceInternalActionsCreators[mInstanceSliceStoreActionNames.entityInstancesReceivedFromAPI](
        {instances:result.data, entity:args.payload}
      )
    );
  } catch (e) {
    yield put({ type: 'instance/failure/instancesNotReceived' })
  }
}

//#########################################################################################
export function* refreshMiroirEntityInstances(args:{type:string, payload:MiroirEntities}):any {
  console.log("refreshMiroirEntityInstances launched", args);
  const entityNames: string[] = args.payload.map((e:MiroirEntity) => e.name);

  try {
    yield all(
      entityNames.map((e:string) => put(mInstanceSliceInternalActionsCreators.fetchMiroirEntityInstances(e)))
    )
    yield put(mInstanceSliceInternalActionsCreators.entityInstancesRefreshed(entityNames));
  } catch (error) {
    console.log("refreshMiroirEntityInstances error",error)
  } finally {
    console.log("refreshMiroirEntityInstances finished")
  }

}


//#########################################################################################
export function* instanceRootSaga() {
  yield all(
    [
      takeEvery(mEntitySliceActionNames.entitiesReceivedNotification, refreshMiroirEntityInstances),
      takeEvery(mInstanceSliceInternalSagaActionNames.refreshMiroirEntityInstances, refreshMiroirEntityInstances),
      takeEvery(mInstanceSliceInternalSagaActionNames.fetchMiroirEntityInstances, fetchMiroirInstanceGen),
    ]
  )
}

//#########################################################################################
export default mInstanceSlice.reducer;