import { MclientI } from '@App/api/MClient';
import { createAction, createSelector, createSlice, Slice } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import { makeActionUpdatesUndoable } from '../state/undoableReducer';
import { MiroirEntities, MiroirEntity } from './Entity';
import { MiroirEntityInstanceWithName } from './Instance';
import { ActionWithPayloadCreator, MactionWithAsyncDispatchType, Mslice } from './Mslice';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
const mInstanceSliceInternalSagaActionNames = {
  fetchInstancesForEntity:  "instances/fetchInstancesForEntity",
  storedInstancesForEntity:  "storedInstancesForEntity",
  refreshEntityInstances:  "instances/refreshEntityInstances",
}

//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const mInstanceSliceStoreActionNames = {
  storeEntityInstancesReceivedFromAPI:"storeEntityInstancesReceivedFromAPI",
  updateEntityInstances:"updateEntityInstances",
}

//#########################################################################################
// events sent by the InstanceSlice, that can be intercepted and acted upon by the outside world
export const mInstanceSliceActionNames = {
  instancesRefreshedForEntity:  "instances/instancesRefreshedForEntity",
  allInstancesRefreshed:  "instances/allInstancesRefreshed",
}

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
//# SLICE
//#########################################################################################
export class InstanceSlice implements Mslice {
  constructor(
    private client: MclientI,
  ) {}

  private entitiesToFetch:string[] = [];
  private entitiesAlreadyFetched:string[] = [];

  // public actionToDispatchMap:Map<string,ActionWithPayloadCreator[]> = new Map(
  //   [
  //     // [
  //     //   "instance/" + mInstanceSliceStoreActionNames.storeEntityInstancesReceivedFromAPI,
  //     //   [
  //     //     {
  //     //       actionCreator: mInstanceSliceInternalActionsCreators.instancesRefreshedForEntity,
  //     //       getActionPayload:(state:any, action:ActionWithPayload)=>action.payload.entity
  //     //     }
  //     //   ]
  //     // ]
  //   ]
  // );

  //#########################################################################################
  *fetchInstancesForEntity(
    _this: InstanceSlice, 
    sliceChannel:Channel<any>,
    args:{type:string, payload:string},
  ):any {
    console.log("fetchInstancesForEntity", args)
    try {
      const _client = _this.client;
      const result:{
        status: number;
        data: any;
        headers: Headers;
        url: string;
    } = yield call(
        () => _client.get('/fakeApi/'+args.payload+ '/all')
      )
      yield put(
        mInstanceSliceInternalActionsCreators[mInstanceSliceStoreActionNames.storeEntityInstancesReceivedFromAPI](
          {instances:result.data, entity:args.payload}
        )
      );
      yield put(
        mInstanceSliceInternalActionsCreators[mInstanceSliceInternalSagaActionNames.storedInstancesForEntity](
          {entity:args.payload}
        )
      );
    } catch (e) {
      console.warn("fetchInstancesForEntity",e)
      yield put({ type: 'instance/failure/instancesNotReceived' })
    }
  }
  
  //#########################################################################################
  *refreshEntityInstances(
    _this: InstanceSlice, 
    sliceChannel:Channel<any>,
    action:{type:string, payload:MiroirEntities},
  ):any {
    // console.log("refreshEntityInstances launched", action.payload.map((e:MiroirEntity) => e.name));
    console.log("refreshEntityInstances launched", action);
    const entityNames: string[] = action.payload.map((e:MiroirEntity) => e.name);
    _this.entitiesToFetch = entityNames.slice();
    _this.entitiesAlreadyFetched = [];
    console.log("refreshEntityInstances entitiesToFetch", _this.entitiesToFetch);
    try {
      yield all(
        entityNames.map((e:string) => put(mInstanceSliceInternalActionsCreators.fetchInstancesForEntity(e)))
      )
    } catch (error) {
      console.log("refreshEntityInstances error",error)
    } finally {
      console.log("refreshEntityInstances finished")
    }
  }
  
  //#########################################################################################
  *storedInstancesForEntity(
    _this: InstanceSlice,
    sliceChannel:Channel<any>,
    args:{type:string, payload:string}
  ):any {
    try {
      // console.log("instanceRefreshedForEntity launched", entityName);
      console.log("storedInstancesForEntity", args, "left to fetch",_this.entitiesToFetch);
      // console.log("instanceRefreshedForEntity", args.payload, "left to fetch",_this.entitiesToFetch);
      const id:number =_this.entitiesToFetch.indexOf(args.payload);
      if (id !== undefined) {
        _this.entitiesAlreadyFetched.push(_this.entitiesToFetch[id]);
        _this.entitiesToFetch.splice(id,1);
      }
      console.log("storedInstancesForEntity", args.payload, id, "left to fetch",_this.entitiesToFetch, "already fetched",_this.entitiesAlreadyFetched);
      if (_this.entitiesToFetch.length == 0) {
        yield put(mInstanceSliceInternalActionsCreators.allInstancesRefreshed());
      }
    } catch (error) {
      console.log("storedInstancesForEntity error",error)
    } finally {
      console.log("storedInstancesForEntity finished")
    }
  }

  
  //#########################################################################################
  public *instanceRootSaga(
    _this: InstanceSlice,
    sliceChannel:Channel<any>,
  ) {
    yield all(
      [
        // listening on potentially modified entity definitions, sent by the entitySlice
        takeEvery(sliceChannel, _this.refreshEntityInstances, _this, sliceChannel),
        // listening on input actions
        // takeEvery(mInstanceSliceInternalActionsCreators.instancesRefreshedForEntity, _this.instanceRefreshedForEntity, _this, sliceChannel),
        takeEvery(mInstanceSliceInternalSagaActionNames.storedInstancesForEntity, _this.storedInstancesForEntity, _this, sliceChannel),
        takeEvery(mInstanceSliceInternalSagaActionNames.refreshEntityInstances, _this.refreshEntityInstances, _this, sliceChannel),
        takeEvery(mInstanceSliceInternalSagaActionNames.fetchInstancesForEntity, _this.fetchInstancesForEntity, _this, sliceChannel),
      ]
    )
  }
}

//#########################################################################################
//# SLICE
//#########################################################################################
const mInstanceSlice:Slice = createSlice(
  {
    name: 'instance',
    initialState: {},
    reducers: {
      [mInstanceSliceStoreActionNames.updateEntityInstances] (state:any, action:MinstanceSliceActionPayloadType) {
        console.log(mInstanceSliceStoreActionNames.updateEntityInstances, state, action)
        action.payload.instances.forEach(
          (instance:MiroirEntityInstanceWithName) => {
            const instanceId:number = state[action.payload.entity].find((i:MiroirEntityInstanceWithName)=>i.uuid === instance.uuid);
            state[action.payload.entity][instanceId] = instance;
          }
        );
      },
      [mInstanceSliceStoreActionNames.storeEntityInstancesReceivedFromAPI] (state:any, action:MinstanceSliceActionPayloadType) {
        console.log(mInstanceSliceStoreActionNames.storeEntityInstancesReceivedFromAPI, JSON.stringify(state), action)
        state[action.payload.entity] = action.payload.instances;
      },
    },
  }
)


//#########################################################################################
//# ACTIONS
//#########################################################################################
// actions sent by the InstanceSlice, to itself or to the oustide world.
export const mInstanceSliceInternalActionsCreators:any = {
  ...mInstanceSlice.actions,
  // [mInstanceSliceStoreActionNames.updateEntityInstances]: createAction<any>(mInstanceSliceStoreActionNames.updateEntityInstances),
  // [mInstanceSliceStoreActionNames.entityInstancesReceivedFromAPI]: createAction<any>(mInstanceSliceStoreActionNames.entityInstancesReceivedFromAPI),
  fetchInstancesForEntity: createAction<string|undefined>(mInstanceSliceInternalSagaActionNames.fetchInstancesForEntity),
  storedInstancesForEntity: createAction<string|undefined>(mInstanceSliceInternalSagaActionNames.storedInstancesForEntity),
  instancesRefreshedForEntity: createAction<string>(mInstanceSliceActionNames.instancesRefreshedForEntity),
  allInstancesRefreshed: createAction(mInstanceSliceActionNames.allInstancesRefreshed),
}

//#########################################################################################
// notify the undoableReducer
makeActionUpdatesUndoable(mInstanceSliceStoreActionNames.updateEntityInstances);

//#########################################################################################
// interface of events creators allowing the outside world to send events to the InstanceSlice.
export const mInstanceSliceActionsCreators = {
  refreshEntityInstances: createAction<MiroirEntities>(mInstanceSliceInternalSagaActionNames.refreshEntityInstances),
}

//#########################################################################################
//# SELECTORS
//#########################################################################################
export const selectMiroirEntityInstances = createSelector((state:any) => state, items=>items)


//#########################################################################################
//# SAGAS
//#########################################################################################

//#########################################################################################
export default mInstanceSlice.reducer;
// export default entityInstancesReducers;
// export default combineReducers(
//   {
//     updateEntityInstances,
//     entityInstancesReceivedFromAPI
//   }
// );