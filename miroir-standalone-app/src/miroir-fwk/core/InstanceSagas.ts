import { createAction } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';
import { MclientI } from 'src/api/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { mEntities, Mentity } from './Entity';
import { mInstanceSliceActionsCreators, mInstanceSliceInputActionNames } from './InstanceSlice';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))


//#########################################################################################
//# ACTION NAMES
//#########################################################################################
// const mInstanceSliceInternalSagaActions:{[actionName:string]:{name:string,actionPayloadType:Type}} = {
export const mInstanceSagaInputActionNames = {
  fetchInstancesFromDatastoreForEntity: "instances/fetchInstancesFromDatastoreForEntity",
  fetchInstancesFromDatastoreForAllEntities:  "instances/fetchInstancesFromDatastoreForAllEntities",
  // instancesHaveBeenFecthedForEntity:  "instancesHaveBeenFecthedForEntity",
}

export const mInstanceSagaInternalActionNames = {
  instancesHaveBeenFecthedForEntity:  "instancesHaveBeenFecthedForEntity",
}

//#########################################################################################
// events sent by the InstanceSlice, that can be intercepted and acted upon by the outside world
export const mInstanceSagaOutputActionNames = {
  instancesRefreshedForEntity:  "instances/instancesRefreshedForEntity",
  allInstancesRefreshed:  "instances/allInstancesRefreshed",
}

// interface MinstanceSliceActionPayloadType extends MactionWithAsyncDispatchType{
//   type: string;
//   payload: MinstanceSliceStateType;
// }


//#########################################################################################
//# SLICE
//#########################################################################################
export class InstanceSagas {
  // TODO:!!!!!!!!!!! Model instances or data instances? They must be treated differently regarding to caching, transactions, undo/redo, etc.
  constructor(
    private client: MclientI,
    // public mInstanceSlice:Slice,
  ) {}

  private entitiesToFetch:string[] = [];
  private entitiesAlreadyFetched:string[] = [];

  //#########################################################################################
  *fetchInstancesFromDatastoreForEntity(
    _this: InstanceSagas, 
    sliceChannel:Channel<any>,
    args:{type:string, payload:string},
  ):any {
    // console.log("fetchInstancesForEntity", args)
    try {
      const _client = _this.client;
      const result:{
        status: number;
        data: any;
        headers: Headers;
        url: string;
    } = yield call(
        () => _client.get(miroirConfig.rootApiUrl+'/'+args.payload+ '/all')
      )
      yield putResolve(
        mInstanceSliceActionsCreators[mInstanceSliceInputActionNames.ReplaceInstancesForEntity](
          {instances:result.data, entity:args.payload}
        )
      );
      yield put(
        _this.mInstanceSagaInternalActionsCreators[mInstanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity](
          args.payload
        )
      );
    } catch (e) {
      console.warn("fetchInstancesForEntity",e)
      yield put({ type: 'instance/failure/instancesNotReceived' })
    }
  }

  //#########################################################################################
  *fetchInstancesFromDatastoreForAllEntities(
    _this: InstanceSagas, 
    sliceChannel:Channel<any>,
    action:{type:string, payload:mEntities},
  ):any {
    // console.log("refreshEntityInstances launched", action.payload.map((e:MiroirEntity) => e.name));
    console.log("refreshEntityInstances launched", action);
    const entityNames: string[] = action.payload.map((e:Mentity) => e.name);
    _this.entitiesToFetch = entityNames.slice();
    _this.entitiesAlreadyFetched = [];
    console.log("refreshEntityInstances entitiesToFetch", _this.entitiesToFetch);
    try {
      yield all(
        // entityNames.map((e:string) => put(_this.mInstanceSagaInternalActionsCreators.fetchInstancesForEntity(e)))
        entityNames.map((e:string) => put(_this.mInstanceSagaInternalActionsCreators.fetchInstancesFromDatastoreForEntity(e)))
      )
    } catch (error) {
      console.log("refreshEntityInstances error",error)
    } finally {
      console.log("refreshEntityInstances finished")
    }
  }
  
  //#########################################################################################
  *instancesHaveBeenFecthedForEntity(
    _this: InstanceSagas,
    sliceChannel:Channel<any>,
    args:{type:string, payload:string}
  ):any {
    try {
      console.log("instancesHaveBeenFecthedForEntity", args, "left to fetch",_this.entitiesToFetch);
      const id:number =_this.entitiesToFetch.indexOf(args.payload);
      if (id !== undefined) {
        _this.entitiesAlreadyFetched.push(_this.entitiesToFetch[id]);
        _this.entitiesToFetch.splice(id,1);
      }
      console.log("instancesHaveBeenFecthedForEntity", args.payload, id, "left to fetch",_this.entitiesToFetch, "already fetched",_this.entitiesAlreadyFetched);
      if (_this.entitiesToFetch.length == 0) {
        yield put(_this.mInstanceSagaInternalActionsCreators.allInstancesRefreshed());
      }
    } catch (error) {
      console.log("instancesHaveBeenFecthedForEntity error",error)
    } finally {
      console.log("instancesHaveBeenFecthedForEntity finished")
    }
  }

  
  //#########################################################################################
  public *instanceRootSaga(
    _this: InstanceSagas,
    sliceChannel:Channel<any>,
  ) {
    yield all(
      [
        // listening on potentially modified entity definitions, sent by the entitySlice
        takeEvery(sliceChannel, _this.fetchInstancesFromDatastoreForAllEntities, _this, sliceChannel),
        // listening on input actions
        takeEvery(mInstanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity, _this.instancesHaveBeenFecthedForEntity, _this, sliceChannel),
        takeEvery(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForAllEntities, _this.fetchInstancesFromDatastoreForAllEntities, _this, sliceChannel),
        takeEvery(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForEntity, _this.fetchInstancesFromDatastoreForEntity, _this, sliceChannel),
      ]
    )
  }

  //#########################################################################################
  //# ACTIONS
  //#########################################################################################
  // actions sent by the InstanceSlice, to itself or to the oustide world.
  public mInstanceSagaInternalActionsCreators:any = {
    // ...InstanceReduxSlice.actions,
    fetchInstancesFromDatastoreForEntity: createAction<string>(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForEntity),
    instancesHaveBeenFecthedForEntity: createAction<string>(mInstanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity),
    allInstancesRefreshed: createAction(mInstanceSagaOutputActionNames.allInstancesRefreshed),
  }

  //#########################################################################################
  // notify the undoableReducer
  // makeActionUpdatesUndoable(mInstanceSliceStoreActionNames.updateEntityInstances);

  //#########################################################################################
  // interface of events creators allowing the outside world to send events to the InstanceSlice.
  public mInstanceSliceActionsCreators = {
    fetchInstancesFromDatastoreForAllEntities: createAction<mEntities>(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForAllEntities),
  }

  //#########################################################################################
  //# SELECTORS
  //#########################################################################################
  
}// end class Mslice

export default InstanceSagas;

