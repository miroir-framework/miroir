import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseActionFactory,
  SagaPromiseActionCreator
} from "@teroneko/redux-saga-promise";
import { all, call, Effect, put, putResolve, takeEvery } from 'redux-saga/effects';


import {
  EntityDefinition, RemoteStoreAction, RemoteStoreActionReturnType, RemoteStoreNetworkClientInterface, stringTuple
} from "miroir-core";
import miroirConfig from "miroir-fwk/assets/miroirConfig.json";
import { handlePromiseActionForSaga } from 'sagaTools';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

export type SagaGenReturnType = Effect | Generator<RemoteStoreActionReturnType>;


export function getPromiseActionStoreActionNames(promiseActionNames:string[]):string[] {
  return promiseActionNames 
    .reduce(
      (acc:string[],curr) => acc.concat([curr,'saga-' + curr,curr+'/rejected']),[]
    )
  ;
}


//#########################################################################################
//# ACTION NAMES
//#########################################################################################
const instanceSagaInputActionNamesObject = {
  'fetchInstancesForEntityFromRemoteDatastore':'fetchInstancesForEntityFromRemoteDatastore',
  'handleRemoteStoreAction':'handleRemoteStoreAction',
};
export type instanceSagaInputActionName = keyof typeof instanceSagaInputActionNamesObject;
export const instanceSagaInputActionNamesArray:instanceSagaInputActionName[] = 
  Object.keys(instanceSagaInputActionNamesObject) as instanceSagaInputActionName[];
export const instanceSagaGeneratedActionNames = getPromiseActionStoreActionNames(instanceSagaInputActionNamesArray);


//#########################################################################################
// events sent by the InstanceSlice, that can be intercepted and acted upon by the outside world
export const instanceSagaOutputActionNames = stringTuple(
  'instancesRefreshedForEntity', 'allInstancesRefreshed'
);
export type instanceSagaOutputActionTypeString = typeof instanceSagaOutputActionNames[number];

//#########################################################################################
//# SLICE
//#########################################################################################
export type InstanceSagaStringActionPayload = string;
export type InstanceSagaEntitiesActionPayload = EntityDefinition[];

export type InstanceSagaAction = PayloadAction<InstanceSagaEntitiesActionPayload|InstanceSagaStringActionPayload>;


//#########################################################################################
//# SLICE
//#########################################################################################
export class InstanceRemoteAccessReduxSaga {
  // TODO:!!!!!!!!!!! Model instances or data instances? They must be treated differently regarding to caching, transactions, undo/redo, etc.
  // TODO: do not use client directly, it is a dependence on implementation. Use an interface to hide Rest/graphql implementation.
  constructor(private client: RemoteStoreNetworkClientInterface) // public mInstanceSlice:Slice,
  {}

  private entitiesToFetch: string[] = [];
  private entitiesAlreadyFetched: string[] = [];

//#########################################################################################
public instanceSagaInputPromiseActions:{
    [property in instanceSagaInputActionName]
    : {
      name: property,
      creator:SagaPromiseActionCreator<
        any,
        any,
        property,
        ActionCreatorWithPayload<any, property>
      >,
      generator:(any) => SagaGenReturnType
    }
  } = {
    fetchInstancesForEntityFromRemoteDatastore: {
      name: "fetchInstancesForEntityFromRemoteDatastore",
      creator: promiseActionFactory<RemoteStoreActionReturnType>().create<string,"fetchInstancesForEntityFromRemoteDatastore">("fetchInstancesForEntityFromRemoteDatastore"),
      generator: function*(action:PayloadAction<string>):SagaGenReturnType {
        console.log("fetchInstancesForEntityFromRemoteDatastore", action);
        try {
          const result: {
            status: number,
            data: any,
            headers: Headers,
            url: string,
          } = yield call(() => this.client.get(miroirConfig.rootApiUrl + "/" + action.payload + "/all"));
          return {
            status:'ok', 
            instances:[
              {entity:action.payload, instances:result['data']}
            ]
          };
        } catch (e) {
          console.warn("fetchInstancesForEntityFromRemoteDatastore", e);
          yield put({ type: "instance/failure/instancesNotReceived" });
        }
      }.bind(this)
    },
    handleRemoteStoreAction: {
      name: "handleRemoteStoreAction",
      creator: promiseActionFactory<RemoteStoreActionReturnType>().create<RemoteStoreAction,"handleRemoteStoreAction">("handleRemoteStoreAction"),
      generator: function*(action:PayloadAction<RemoteStoreAction>):SagaGenReturnType {
        try {
          console.log("InstanceRemoteAccessReduxSaga handleRemoteStoreAction",action);

          let result: RemoteStoreActionReturnType;
          switch (action.payload.actionName) {
            case 'read':
              result = yield putResolve(this.instanceSagaInputPromiseActions.fetchInstancesForEntityFromRemoteDatastore.creator(action.payload.entityName))
              break;
          }
          // const result:RemoteStoreActionReturnType = yield putResolve(this.instanceSagaInputPromiseActions.fetchInstancesForEntityListFromRemoteDatastore.creator(action.payload.objects));
          console.log("InstanceRemoteAccessReduxSaga handleRemoteStoreAction received result", result.status, result.instances);
          return yield { status: "ok", instances: result.instances };
        } catch (e: any) {
          console.warn("InstanceRemoteAccessReduxSaga handleRemoteStoreAction exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreActionReturnType;
        }
      }.bind(this)
    },
  };

  //#########################################################################################
  // takes entity fetch notifications into account and sends a global notification when done.
  *instancesHaveBeenFecthedForEntity(
    action: PayloadAction<string>
  ): SagaGenReturnType {
    try {
      console.log("instancesHaveBeenFecthedForEntity", action, "left to fetch", this.entitiesToFetch);
      const id: number = this.entitiesToFetch.indexOf(action.payload);
      if (id !== undefined) {
        this.entitiesAlreadyFetched.push(this.entitiesToFetch[id]);
        this.entitiesToFetch.splice(id, 1);
      }
      console.log(
        "instancesHaveBeenFecthedForEntity",
        action.payload,
        id,
        "left to fetch",
        this.entitiesToFetch,
        "already fetched",
        this.entitiesAlreadyFetched
      );
      if (this.entitiesToFetch.length == 0) {
        return yield put({ type: "allInstancesRefreshed", status: "OK" });
      }
    } catch (error) {
      console.log("instancesHaveBeenFecthedForEntity error", error);
    } finally {
      console.log("instancesHaveBeenFecthedForEntity finished");
    }
  }

  //#########################################################################################
  public *instanceRootSaga(
  ):SagaGenReturnType {
    yield all(
      [
        ...Object.values(this.instanceSagaInputPromiseActions).map(
          a => takeEvery(
            a.creator,
            handlePromiseActionForSaga(a.generator)
          )
        ),
      ]
    );
  }
}// end class Mslice

export default InstanceRemoteAccessReduxSaga;

