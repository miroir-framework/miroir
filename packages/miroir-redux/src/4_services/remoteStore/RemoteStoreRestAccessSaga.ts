import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseActionFactory,
  SagaPromiseActionCreator
} from "@teroneko/redux-saga-promise";
import { all, call, Effect, put, takeEvery } from 'redux-saga/effects';


import { RemoteStoreCRUDAction, RemoteStoreCRUDActionReturnType, RemoteStoreModelAction, RemoteStoreNetworkClientInterface, stringTuple } from "miroir-core";
import { handlePromiseActionForSaga } from 'src/sagaTools';

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

export type RemoteStoreSagaGenReturnType = Effect | Generator<RemoteStoreCRUDActionReturnType>;


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
export const RemoteStoreRestSagaInputActionNamesObject = {
  // 'fetchInstancesForEntityFromRemoteDatastore':'fetchInstancesForEntityFromRemoteDatastore',
  'handleRemoteStoreCRUDAction':'handleRemoteStoreCRUDAction',
  'handleRemoteStoreModelAction':'handleRemoteStoreModelAction',
  'handleRemoteStoreCRUDActionWithDeployment':'handleRemoteStoreCRUDActionWithDeployment',
  'handleRemoteStoreModelActionWithDeployment':'handleRemoteStoreModelActionWithDeployment',
};
export type RemoteStoreRestSagaInputActionName = keyof typeof RemoteStoreRestSagaInputActionNamesObject;
export const RemoteStoreRestSagaInputActionNamesArray:RemoteStoreRestSagaInputActionName[] = 
  Object.keys(RemoteStoreRestSagaInputActionNamesObject) as RemoteStoreRestSagaInputActionName[];
export const RemoteStoreRestSagaGeneratedActionNames = getPromiseActionStoreActionNames(RemoteStoreRestSagaInputActionNamesArray);


//#########################################################################################
// events sent by the LocalCacheSlice, that can be intercepted and acted upon by the outside world
export const RemoteStoreRestSagaOutputActionNames = stringTuple(
  'instancesRefreshedForEntity', 'allInstancesRefreshed'
);
export type RemoteStoreRestSagaOutputActionTypeString = typeof RemoteStoreRestSagaOutputActionNames[number];

//#########################################################################################
//# SLICE
//#########################################################################################
export class RemoteStoreRestAccessReduxSaga {
  // TODO:!!!!!!!!!!! Model instances or data instances? They must be treated differently regarding to caching, transactions, undo/redo, etc.
  // TODO: do not use client directly, it is a dependence on implementation. Use an interface to hide Rest/graphql implementation.
  constructor(
    private rootApiUrl:string,
    private remoteStoreNetworkClient: RemoteStoreNetworkClientInterface
  ) // public mInstanceSlice:Slice,
  {}

  private entitiesToFetch: string[] = [];
  private entitiesAlreadyFetched: string[] = [];

  //#########################################################################################
  public remoteStoreRestAccessSagaInputPromiseActions:{
    [property in RemoteStoreRestSagaInputActionName]
    : {
      name: property,
      creator:SagaPromiseActionCreator<
        any,
        any,
        property,
        ActionCreatorWithPayload<any, property>
      >,
      generator:(any) => RemoteStoreSagaGenReturnType
    }
  } = {
    handleRemoteStoreCRUDAction: {
      name: "handleRemoteStoreCRUDAction",
      creator: promiseActionFactory<RemoteStoreCRUDActionReturnType>().create<RemoteStoreCRUDAction,"handleRemoteStoreCRUDAction">("handleRemoteStoreCRUDAction"),
      generator: function*(action:PayloadAction<RemoteStoreCRUDAction>):RemoteStoreSagaGenReturnType {
        try {
          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDAction",action);
          const clientResult: {
            status: number,
            data: any,
            headers: Headers,
            url: string,
          // } = yield call(() => this.client.handleNetworkAction(action.payload));
          } = yield call(() => this.remoteStoreNetworkClient.handleNetworkRemoteStoreCRUDAction(action.payload));
          const result = {
            status:'ok',
            instances:[
              {
                entity:action.payload?.parentName,
                parentUuid:action.payload?.parentUuid,
                instances:clientResult['data']
              }
            ]
          };

          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDAction received result", result.status, result.instances);
          return yield { status: "ok", instances: result.instances };
        } catch (e: any) {
          console.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDAction exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreCRUDActionReturnType;
        }
      }.bind(this)
    },
    handleRemoteStoreModelAction: {
      name: "handleRemoteStoreModelAction",
      creator: promiseActionFactory<RemoteStoreCRUDActionReturnType>().create<RemoteStoreModelAction,"handleRemoteStoreModelAction">("handleRemoteStoreModelAction"),
      generator: function*(action:PayloadAction<RemoteStoreModelAction>):RemoteStoreSagaGenReturnType {
        try {
          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelAction",action);
          const clientResult: {
            status: number,
            data: any,
            headers: Headers,
            url: string,
          } = yield call(() => this.remoteStoreNetworkClient.handleNetworkRemoteStoreModelAction(action.payload));
          // } = yield call(() => this.client.handleNetworkAction(action));
          const result = {
            status:'ok',
            instances:[
              // {entity:action.payload?.parentName, instances:clientResult['data']}
            ]
          };

          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelAction received result", result.status, result.instances);
          return yield { status: "ok", instances: result.instances };
        } catch (e: any) {
          console.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelAction exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreCRUDActionReturnType;
        }
      }.bind(this)
    },
    handleRemoteStoreCRUDActionWithDeployment: {
      name: "handleRemoteStoreCRUDActionWithDeployment",
      creator: promiseActionFactory<RemoteStoreCRUDActionReturnType>().create<{deploymentUuid:string, action:RemoteStoreCRUDAction},"handleRemoteStoreCRUDActionWithDeployment">("handleRemoteStoreCRUDActionWithDeployment"),
      generator: function*(p:PayloadAction<{deploymentUuid:string, action:RemoteStoreCRUDAction}>):RemoteStoreSagaGenReturnType {
        const {deploymentUuid, action} = p.payload;
        try {
          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDActionWithDeployment param",p);
          const clientResult: {
            status: number,
            data: any,
            headers: Headers,
            url: string,
          // } = yield call(() => this.client.handleNetworkAction(action.payload));
          } = yield call(() => this.remoteStoreNetworkClient.handleNetworkRemoteStoreCRUDActionWithDeployment(deploymentUuid, action));
          const result = {
            status:'ok',
            instances:[
              {
                entity:action.parentName,
                parentUuid:action.parentUuid,
                instances:clientResult['data']
              }
            ]
          };

          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDActionWithDeployment received result", result.status, result.instances);
          return yield { status: "ok", instances: result.instances };
        } catch (e: any) {
          console.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDActionWithDeployment exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreCRUDActionReturnType;
        }
      }.bind(this)
    },
    handleRemoteStoreModelActionWithDeployment: {
      name: "handleRemoteStoreModelActionWithDeployment",
      creator: promiseActionFactory<RemoteStoreCRUDActionReturnType>().create<{deploymentUuid:string, action:RemoteStoreModelAction},"handleRemoteStoreModelActionWithDeployment">("handleRemoteStoreModelActionWithDeployment"),
      generator: function*(p:PayloadAction<{deploymentUuid:string, action:RemoteStoreCRUDAction}>):RemoteStoreSagaGenReturnType {
        const {deploymentUuid, action} = p.payload;
        try {
          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelActionWithDeployment",action);
          const clientResult: {
            status: number,
            data: any,
            headers: Headers,
            url: string,
          } = yield call(() => this.remoteStoreNetworkClient.handleNetworkRemoteStoreModelActionWithDeployment(deploymentUuid, action));
          // } = yield call(() => this.client.handleNetworkAction(action));
          const result = {
            status:'ok',
            instances:[
              // {entity:action.payload?.parentName, instances:clientResult['data']}
            ]
          };

          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelActionWithDeployment received result", result.status, result.instances);
          return yield { status: "ok", instances: result.instances };
        } catch (e: any) {
          console.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelActionWithDeployment exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreCRUDActionReturnType;
        }
      }.bind(this)
    },
  };

  //#########################################################################################
  public *instanceRootSaga(
  ):RemoteStoreSagaGenReturnType {
    yield all(
      [
        ...Object.values(this.remoteStoreRestAccessSagaInputPromiseActions).map(
          a => takeEvery(
            a.creator,
            handlePromiseActionForSaga(a.generator)
          )
        ),
      ]
    );
  }
}// end class Mslice

export default RemoteStoreRestAccessReduxSaga;

