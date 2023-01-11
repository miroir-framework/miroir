import { createAction, PayloadAction } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';
import { MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';
import miroirConfig from "src/miroir-fwk/assets/miroirConfig.json";
import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import instanceSliceObject, { mInstanceSliceInputActionNames } from '../local/InstanceSlice';
import { LocalStoreEvent } from 'src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreInterface';
import { stringTuple } from 'src/miroir-fwk/1_core/utils/utils';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))


//#########################################################################################
//# ACTION NAMES
//#########################################################################################
// const mInstanceSliceInternalSagaActions:{[actionName:string]:{name:string,actionPayloadType:Type}} = {
export const mInstanceSagaInputActionNames = {
  fetchInstancesFromDatastoreForEntityList: "instances/fetchInstancesFromDatastoreForEntityList",
  fetchInstancesFromDatastoreForAllEntities:  "instances/fetchInstancesFromDatastoreForAllEntities",
  // instancesHaveBeenFecthedForEntity:  "instancesHaveBeenFecthedForEntity",
}

export const mInstanceSagaInternalActionNames = {
  fetchInstancesFromDatastoreForEntity: "instances/fetchInstancesFromDatastoreForEntity",
  instancesHaveBeenFecthedForEntity:  "instancesHaveBeenFecthedForEntity",
}

//#########################################################################################
// events sent by the InstanceSlice, that can be intercepted and acted upon by the outside world
export const mInstanceSagaOutputActionNames = {
  instancesRefreshedForEntity:  "instances/instancesRefreshedForEntity",
  allInstancesRefreshed:  "instances/allInstancesRefreshed",
}


export const instanceSagaOutputActionNames = stringTuple(
  'instancesRefreshedForEntity', 'allInstancesRefreshed'
);
export type instanceSagaOutputActionTypeString = typeof instanceSagaOutputActionNames[number];

//#########################################################################################
//# SLICE
//#########################################################################################
export type InstanceSagaStringActionPayload = string;
export type InstanceSagaEntitiesActionPayload = MEntityDefinition[];

export type InstanceSagaAction = PayloadAction<InstanceSagaEntitiesActionPayload|InstanceSagaStringActionPayload>;


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
    outputChannel:Channel<any>,
    action:PayloadAction<string>,
  ):any {
    // console.log("fetchInstancesForEntity", args)
    try {
      const result:{
        status: number;
        data: any;
        headers: Headers;
        url: string;
    } = yield call(
        () => this.client.get(miroirConfig.rootApiUrl+'/'+action.payload+ '/all')
      )
      yield putResolve(
        instanceSliceObject.actionCreators[mInstanceSliceInputActionNames.ReplaceInstancesForEntity](
          {instances:result.data, entity:action.payload}
        )
      );
      yield put(
        this.instanceSagaInternalActionsCreators[mInstanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity](
          action.payload
        )
      );
    } catch (e) {
      console.warn("fetchInstancesForEntity",e)
      yield put({ type: 'instance/failure/instancesNotReceived' })
    }
  }

  //#########################################################################################
  *fetchInstancesFromDatastoreForEntityList(
    // _this: InstanceSagas, 
    outputChannel:Channel<any>,
    action:PayloadAction<MEntityDefinition[]>,
  ):any {
    // console.log("refreshEntityInstances launched", action.payload.map((e:MiroirEntity) => e.name));
    console.log("refreshEntityInstances launched", action);
    const entityNames: string[] = action.payload.map((e:MEntityDefinition) => e.name);
    this.entitiesToFetch = entityNames.slice();
    this.entitiesAlreadyFetched = [];
    console.log("refreshEntityInstances entitiesToFetch", this.entitiesToFetch);
    try {
      yield all(
        // entityNames.map((e:string) => put(_this.mInstanceSagaInternalActionsCreators.fetchInstancesForEntity(e)))
        entityNames.map((e:string) => put(this.instanceSagaInternalActionsCreators.fetchInstancesFromDatastoreForEntity(e)))
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
    // _this: InstanceSagas,
    outputChannel:Channel<LocalStoreEvent>,
    action:PayloadAction<string>
  ):any {
    try {
      console.log("instancesHaveBeenFecthedForEntity", action, "left to fetch",this.entitiesToFetch);
      const id:number =this.entitiesToFetch.indexOf(action.payload);
      if (id !== undefined) {
        this.entitiesAlreadyFetched.push(this.entitiesToFetch[id]);
        this.entitiesToFetch.splice(id,1);
      }
      yield put(outputChannel, {eventName:"instancesRefreshedForEntity",status:'OK',param:action.payload});
      console.log("instancesHaveBeenFecthedForEntity", action.payload, id, "left to fetch",this.entitiesToFetch, "already fetched",this.entitiesAlreadyFetched);
      if (this.entitiesToFetch.length == 0) {
        yield put(outputChannel, {eventName:"allInstancesRefreshed",status:'OK'});
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
    outputChannel:Channel<LocalStoreEvent>,
  ) {
    yield all(
      [
        takeEvery(mInstanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity, this.instancesHaveBeenFecthedForEntity.bind(this), outputChannel),
        takeEvery(mInstanceSagaInternalActionNames.fetchInstancesFromDatastoreForEntity, this.fetchInstancesFromDatastoreForEntity.bind(this), outputChannel),
        // listening on input actions
        takeEvery(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForEntityList, this.fetchInstancesFromDatastoreForEntityList.bind(this), outputChannel),
        takeEvery(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForAllEntities, this.fetchInstancesFromDatastoreForEntityList.bind(this), outputChannel),
      ]
    )
  }

  //#########################################################################################
  //# ACTIONS
  //#########################################################################################
  // actions sent by the InstanceSlice, to itself or to the oustide world.
  public instanceSagaInternalActionsCreators:any = {
    // ...InstanceReduxSlice.actions,
    fetchInstancesFromDatastoreForEntity: createAction<string>(mInstanceSagaInternalActionNames.fetchInstancesFromDatastoreForEntity),
    instancesHaveBeenFecthedForEntity: createAction<string>(mInstanceSagaInternalActionNames.instancesHaveBeenFecthedForEntity),
  }

  //#########################################################################################
  // public instanceSagaOutputActionsCreators:any = {
  //   allInstancesRefreshed: createAction(mInstanceSagaOutputActionNames.allInstancesRefreshed),
  // }

  //#########################################################################################
  // interface of events creators allowing the outside world to send events to the InstanceSlice.
  public instanceSagaInputActionsCreators = {
    // fetchInstancesFromDatastoreForEntityList: createAction<MEntityDefinition[]>(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForAllEntities),
    fetchInstancesFromDatastoreForEntityList: createAction<MEntityDefinition[]>(mInstanceSagaInputActionNames.fetchInstancesFromDatastoreForEntityList),
  }

  //#########################################################################################
  //# SELECTORS
  //#########################################################################################
  
}// end class Mslice

export default InstanceSagas;

