import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseActionFactory,
  SagaPromiseActionCreator
} from "@teroneko/redux-saga-promise";
import { all, call, Effect, put, takeEvery } from 'redux-saga/effects';


import {
  ApplicationSection,
  HttpResponseBodyFormat,
  LoggerInterface,
  MiroirLoggerFactory,
  RemoteStoreCRUDAction,
  RemoteStoreActionReturnType,
  RemoteStoreModelAction,
  RemoteStoreNetworkClientInterface,
  getLoggerName,
  stringTuple,
  EntityAction,
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

export type RemoteStoreSagaGenReturnType = Effect | Generator<RemoteStoreActionReturnType>;


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
  'handleRemoteStoreModelAction':'handleRemoteStoreModelAction',
  'handleRemoteStoreEntityAction':'handleRemoteStoreEntityAction',
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
      ): RemoteStoreSagaGenReturnType {
        const { deploymentUuid, section, action } = p.payload;
        try {
          log.info("RemoteStoreRestAccessReduxSaga handleRemoteStoreRestCRUDAction param",p);
          const clientResult: {
            status: number,
            data: HttpResponseBodyFormat,
            headers: Headers,
            url: string,
          } = yield call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreCRUDAction(
              deploymentUuid,
              section,
              action
            )
          );
          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreRestCRUDAction received clientResult",clientResult);
          const result = {
            status: "ok",
            instanceCollection: clientResult.data.instances,
          };

          // log.info("RemoteStoreRestAccessReduxSaga handleRemoteStoreRestCRUDAction received result", result);
          return yield result;
        } catch (e: any) {
          log.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreRestCRUDAction exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreActionReturnType;
        }
      }.bind(this as RemoteStoreRestAccessReduxSaga),
    },
    handleRemoteStoreEntityAction: {
      name: "handleRemoteStoreEntityAction",
      creator: promiseActionFactory<RemoteStoreActionReturnType>().create<
        { deploymentUuid: string; action: EntityAction },
        "handleRemoteStoreEntityAction"
      >("handleRemoteStoreEntityAction"),
      generator: function* (
        this: RemoteStoreRestAccessReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; action: EntityAction }>
      ): RemoteStoreSagaGenReturnType {
        const { deploymentUuid, action } = p.payload;
        try {
          log.info("RemoteStoreRestAccessReduxSaga handleRemoteStoreEntityAction on action",action);
          const clientResult: {
            status: number;
            data: any;
            headers: Headers;
            url: string;
          } = yield call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreEntityAction(deploymentUuid, action)
          );
          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreEntityAction received clientResult", clientResult);

          const result = {
            status: "ok",
            // instanceCollection: {entity:action?., instanceCollection:clientResult['data']}
          };

          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreEntityAction received result", result.status);
          return yield result;
        } catch (e: any) {
          log.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreEntityAction exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
          return {
            status: "error",
            errorMessage: e["message"],
            error: { errorMessage: e["message"], stack: [e["message"]] },
          } as RemoteStoreActionReturnType;
        }
      }.bind(this),
    },
    handleRemoteStoreModelAction: {
      name: "handleRemoteStoreModelAction",
      creator: promiseActionFactory<RemoteStoreActionReturnType>().create<
        { deploymentUuid: string; action: RemoteStoreModelAction },
        "handleRemoteStoreModelAction"
      >("handleRemoteStoreModelAction"),
      generator: function* (
        this: RemoteStoreRestAccessReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; action: RemoteStoreModelAction }>
      ): RemoteStoreSagaGenReturnType {
        const { deploymentUuid, action } = p.payload;
        try {
          log.info("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelAction on action",action);
          const clientResult: {
            status: number;
            data: any;
            headers: Headers;
            url: string;
          } = yield call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreModelAction(deploymentUuid, action)
          );
          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelAction received clientResult", clientResult);

          const result = {
            status: "ok",
            // instanceCollection: {entity:action?., instanceCollection:clientResult['data']}
          };

          log.debug("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelAction received result", result.status);
          return yield result;
        } catch (e: any) {
          log.error("RemoteStoreRestAccessReduxSaga handleRemoteStoreModelAction exception", e);
          yield put({ type: "instances/failure/instancesNotReceived" });
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
  public *instanceRootSaga(): RemoteStoreSagaGenReturnType {
    yield all([
      ...Object.values(this.remoteStoreRestAccessSagaInputPromiseActions).map((a: any) =>
        takeEvery(a.creator, handlePromiseActionForSaga(a.generator))
      ),
    ]);
  }
}// end class Mslice

export default RemoteStoreRestAccessReduxSaga;

