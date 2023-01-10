import { createAction } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';
import { MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import instanceSliceObject, { mInstanceSliceInputActionNames } from '../local/InstanceSlice';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))


//#########################################################################################
//# ACTION NAMES
//#########################################################################################
// const mInstanceSliceInternalSagaActions:{[actionName:string]:{name:string,actionPayloadType:Type}} = {
export const mInstanceSagaInputActionNames = {
  fetchInstancesFromDatastoreForEntity: "instances/fetchInstancesFromDatastoreForEntity",
  fetchInstancesFromDatastoreForEntityList: "instances/fetchInstancesFromDatastoreForEntityList",
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
  // TODO: do not use client directly, it is a dependence on implementation. Use an interface to hide Rest/graphql implementation.
  constructor(
    private client: MclientI,
    // public mInstanceSlice:Slice,
  ) {}

  private entitiesToFetch:string[] = [];
  private entitiesAlreadyFetched:string[] = [];

  //#########################################################################################
  *fetchInstancesFromDatastoreForEntity(
    _this: InstanceSagas, 
    outputChannel:Channel<any>,
    args:{type:string, payload:string},
  ):any {
    // console.log("fetchInstancesForEntity", args)
    try {
      const result:{
        status: number;
        data: any;
        headers: Headers;
        url: string;
    } = yield call(
        () => _this.client.get(miroirConfig.rootApiUrl+'/'+args.payload+ '/all')
      )
      yield putResolve(
        instanceSliceObject.actionCreators[mInstanceSliceInputActionNames.ReplaceInstancesForEntity](
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
  *fetchInstancesFromDatastoreForEntityList(
    _this: InstanceSagas, 
    outputChannel:Channel<any>,
    action:{type:string, payload:MEntityDefinition[]},
  ):any {
    // console.log("refreshEntityInstances launched", action.payload.map((e:MiroirEntity) => e.name));
    console.log("refreshEntityInstances launched", action);
    const entityNames: string[] = action.payload.map((e:MEntityDefinition) => e.name);
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
  // takes entity fetch notifications into account and sends a global notification when done.
  *instancesHaveBeenFecthedForEntity(
    _this: InstanceSagas,
    outputChannel:Channel<any>,
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
    outputChannel:Channel<any>,
  ) {
    yield all(
      [
        takeEvery(mInstanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity, _this.instancesHaveBeenFecthedForEntity, _this, outputChannel),
        // listening on input actions
        takeEvery(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForEntity, _this.fetchInstancesFromDatastoreForEntity, _this, outputChannel),
        takeEvery(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForEntityList, _this.fetchInstancesFromDatastoreForEntityList, _this, outputChannel),
        takeEvery(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForAllEntities, _this.fetchInstancesFromDatastoreForEntityList, _this, outputChannel),
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
    fetchInstancesFromDatastoreForEntityList: createAction<MEntityDefinition[]>(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForEntityList),
    instancesHaveBeenFecthedForEntity: createAction<string>(mInstanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity),
    allInstancesRefreshed: createAction(mInstanceSagaOutputActionNames.allInstancesRefreshed),
  }

  //#########################################################################################
  // notify the undoableReducer
  // makeActionUpdatesUndoable(mInstanceSliceStoreActionNames.updateEntityInstances);

  //#########################################################################################
  // interface of events creators allowing the outside world to send events to the InstanceSlice.
  public mInstanceSagaActionsCreators = {
    fetchInstancesFromDatastoreForEntityList: createAction<MEntityDefinition[]>(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForAllEntities),
  }

  //#########################################################################################
  //# SELECTORS
  //#########################################################################################
  
}// end class Mslice

export default InstanceSagas;

