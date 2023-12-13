import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseActionFactory,
  SagaPromiseActionCreator
} from "@teroneko/redux-saga-promise";
import { CallEffect, Effect } from 'redux-saga/effects';
import { call, all, put, takeEvery } from "typed-redux-saga";

import {
  ApplicationSection,
  HttpResponseBodyFormat,
  LoggerInterface,
  MiroirLoggerFactory,
  RemoteStoreCRUDAction,
  RemoteStoreActionReturnType,
  RemoteStoreOLDModelAction,
  RemoteStoreNetworkClientInterface,
  getLoggerName,
  stringTuple,
  ModelAction,
  RestClientCallReturnType,
} from "miroir-core";
import { handlePromiseActionForSaga } from 'src/sagaTools';
import { packageName } from '../../constants';
import { cleanLevel } from '../constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"RemoteStoreRestAccessSaga");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

export type RemoteStoreRestAccessReduxSagaReturnType = RemoteStoreActionReturnType | RestClientCallReturnType;

export type RemoteStoreSagaGenReturnType = Effect | Generator<RemoteStoreRestAccessReduxSagaReturnType>;
// export type RemoteStoreSagaGenReturnType = Effect | Generator<RemoteStoreActionReturnType>;
// export type RemoteStoreSagaGenReturnType = Effect | Generator<RemoteStoreActionReturnType | RestClientCallReturnType>;


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
  'handleRemoteStoreRestCRUDAction':'handleRemoteStoreRestCRUDAction',
  'handleRemoteStoreOLDModelAction':'handleRemoteStoreOLDModelAction',
  'handleRemoteStoreModelEntityAction':'handleRemoteStoreModelEntityAction',
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
    handleRemoteStoreRestCRUDAction: {
      name: "handleRemoteStoreRestCRUDAction",
      creator: promiseActionFactory<RemoteStoreActionReturnType>().create<
        { deploymentUuid: string; section: ApplicationSection; action: RemoteStoreCRUDAction },
        "handleRemoteStoreRestCRUDAction"
      >("handleRemoteStoreRestCRUDAction"),
      generator: function* (
        this: RemoteStoreRestAccessReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; section: ApplicationSection; action: RemoteStoreCRUDAction }>
      ): Generator<RemoteStoreActionReturnType | CallEffect<RestClientCallReturnType>> {
        const { deploymentUuid, section, action } = p.payload;
        try {
          log.info("RemoteStoreRestAccessReduxSaga handleRemoteStoreRestCRUDAction param",p);
          const clientResult : RestClientCallReturnType
            = yield* call(
              () => 
                this.remoteStoreNetworkClient.handleNetworkRemoteStoreCRUDAction(
                  deploymentUuid,
                  section,
                  action
                )
            );

          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreRestCRUDAction received clientResult",clientResult);
          const result:RemoteStoreActionReturnType = {
            status: "ok",
            instanceCollection: clientResult.data.instances,
          };

          // log.info("RemoteStoreRestAccessReduxSaga handleRemoteStoreRestCRUDAction received result", result);
          return yield result;
        } catch (e: any) {
          log.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreRestCRUDAction exception", e);
          // yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreActionReturnType;
        }
      }.bind(this as RemoteStoreRestAccessReduxSaga),
    },
    handleRemoteStoreModelEntityAction: {
      name: "handleRemoteStoreModelEntityAction",
      creator: promiseActionFactory<RemoteStoreActionReturnType>().create<
        { deploymentUuid: string; action: ModelAction },
        "handleRemoteStoreModelEntityAction"
      >("handleRemoteStoreModelEntityAction"),
      generator: function* (
        this: RemoteStoreRestAccessReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; action: ModelAction }>
      ): Generator<RemoteStoreActionReturnType | CallEffect<RestClientCallReturnType>> {
        const { deploymentUuid, action } = p.payload;
        try {
          log.info("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelEntityAction on action",action);
          const clientResult: RestClientCallReturnType
           = yield* call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreModelEntityAction(deploymentUuid, action)
          );
          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelEntityAction received clientResult", clientResult);

          const result: RemoteStoreActionReturnType = {
            status: "ok",
            // instanceCollection: {entity:action?., instanceCollection:clientResult['data']}
          };

          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelEntityAction received result", result.status);
          return yield result;
        } catch (e: any) {
          log.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelEntityAction exception", e);
          // yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreActionReturnType;
        }
      }.bind(this),
    },
    handleRemoteStoreOLDModelAction: {
      name: "handleRemoteStoreOLDModelAction",
      creator: promiseActionFactory<RemoteStoreActionReturnType>().create<
        { deploymentUuid: string; action: RemoteStoreOLDModelAction },
        "handleRemoteStoreOLDModelAction"
      >("handleRemoteStoreOLDModelAction"),
      generator: function* (
        this: RemoteStoreRestAccessReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; action: RemoteStoreOLDModelAction }>
      ): Generator<RemoteStoreActionReturnType | CallEffect<RestClientCallReturnType>> {
        const { deploymentUuid, action } = p.payload;
        try {
          log.info("RemoteStoreRestAccessReduxSaga handleRemoteStoreOLDModelAction on action",action);
          const clientResult: RestClientCallReturnType
          = yield* call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreOLDModelAction(deploymentUuid, action)
          );
          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreOLDModelAction received clientResult", clientResult);

          const result: RemoteStoreActionReturnType = {
            status: "ok",
            // instanceCollection: {entity:action?., instanceCollection:clientResult['data']}
          };

          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreOLDModelAction received result", result.status);
          return yield result;
        } catch (e: any) {
          log.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreOLDModelAction exception", e);
          // yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreActionReturnType;
        }
      }.bind(this),
    },
  };

  //#########################################################################################
  // public *instanceRootSaga(): RemoteStoreSagaGenReturnType {
  public *instanceRootSaga() {
    yield all([
      ...Object.values(this.remoteStoreRestAccessSagaInputPromiseActions).map((a: any) =>
        takeEvery(a.creator, handlePromiseActionForSaga(a.generator))
      ),
    ]);
  }
}// end class RemoteStoreRestAccessReduxSaga

export default RemoteStoreRestAccessReduxSaga;

