import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseActionFactory,
  SagaPromiseActionCreator
} from "@teroneko/redux-saga-promise";
import { all, call, Effect, put, takeEvery } from 'redux-saga/effects';


import {
  ApplicationSection,
  HttpResponseBodyFormat,
  RemoteStoreCRUDAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
  RemoteStoreNetworkClientInterface,
  stringTuple,
} from "miroir-core";
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
    private remoteStoreNetworkClient: RemoteStoreNetworkClientInterface // public mInstanceSlice:Slice,
  ) {}

  //#########################################################################################
  public remoteStoreRestAccessSagaInputPromiseActions: {
    [property in RemoteStoreRestSagaInputActionName]: {
      name: property;
      creator: SagaPromiseActionCreator<any, any, property, ActionCreatorWithPayload<any, property>>;
      generator: (a: any) => RemoteStoreSagaGenReturnType;
    };
  } = {
    handleRemoteStoreCRUDActionWithDeployment: {
      name: "handleRemoteStoreCRUDActionWithDeployment",
      creator: promiseActionFactory<RemoteStoreCRUDActionReturnType>().create<
        { deploymentUuid: string; section: ApplicationSection; action: RemoteStoreCRUDAction },
        "handleRemoteStoreCRUDActionWithDeployment"
      >("handleRemoteStoreCRUDActionWithDeployment"),
      generator: function* (
        this: RemoteStoreRestAccessReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; section: ApplicationSection; action: RemoteStoreCRUDAction }>
      ): RemoteStoreSagaGenReturnType {
        const { deploymentUuid, section, action } = p.payload;
        try {
          // console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDActionWithDeployment param",p);
          const clientResult: {
            status: number,
            data: HttpResponseBodyFormat,
            headers: Headers,
            url: string,
            // } = yield call(() => this.client.handleNetworkAction(action.payload));
          } = yield call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreCRUDActionWithDeployment(
              deploymentUuid,
              section,
              action
            )
          );
          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDActionWithDeployment received clientResult",clientResult);
          const result = {
            status: "ok",
            instanceCollection: clientResult.data.instances,
          };

          // console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDActionWithDeployment received result", result);
          return yield result;
        } catch (e: any) {
          console.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreCRUDActionWithDeployment exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreCRUDActionReturnType;
        }
      }.bind(this as RemoteStoreRestAccessReduxSaga),
    },
    handleRemoteStoreModelActionWithDeployment: {
      name: "handleRemoteStoreModelActionWithDeployment",
      creator: promiseActionFactory<RemoteStoreCRUDActionReturnType>().create<
        { deploymentUuid: string; action: RemoteStoreModelAction },
        "handleRemoteStoreModelActionWithDeployment"
      >("handleRemoteStoreModelActionWithDeployment"),
      generator: function* (
        this: RemoteStoreRestAccessReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; action: RemoteStoreModelAction }>
      ): RemoteStoreSagaGenReturnType {
        const { deploymentUuid, action } = p.payload;
        try {
          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelActionWithDeployment on action",action);
          const clientResult: {
            status: number;
            data: any;
            headers: Headers;
            url: string;
          } = yield call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreModelActionWithDeployment(deploymentUuid, action)
          );
          // } = yield call(() => this.client.handleNetworkAction(action));
          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelActionWithDeployment received clientResult", clientResult);

          const result = {
            status: "ok",
            // instanceCollection: {entity:action?., instanceCollection:clientResult['data']}
          };

          console.log("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelActionWithDeployment received result", result.status);
          return yield result;
        } catch (e: any) {
          console.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelActionWithDeployment exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreCRUDActionReturnType;
        }
      }.bind(this),
    },
  };

  //#########################################################################################
  public *instanceRootSaga(): RemoteStoreSagaGenReturnType {
    yield all([
      ...Object.values(this.remoteStoreRestAccessSagaInputPromiseActions).map((a: any) =>
        takeEvery(a.creator, handlePromiseActionForSaga(a.generator))
      ),
    ]);
  }
}// end class Mslice

export default RemoteStoreRestAccessReduxSaga;

