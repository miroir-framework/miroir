import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  SagaPromiseActionCreator,
  promiseActionFactory
} from "@teroneko/redux-saga-promise";
import { CallEffect, Effect } from 'redux-saga/effects';
import { all, call, takeEvery } from "typed-redux-saga";

import {
  ActionReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  RemoteStoreAction,
  RemoteStoreActionReturnType,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  getLoggerName,
  stringTuple
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
  'handleRemoteStoreAction':'handleRemoteStoreAction',
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
    handleRemoteStoreAction: {
      name: "handleRemoteStoreAction",
      creator: promiseActionFactory<ActionReturnType>().create<
        { deploymentUuid: string; action: RemoteStoreAction },
        "handleRemoteStoreAction"
      >("handleRemoteStoreAction"),
      generator: function* (
        this: RemoteStoreRestAccessReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; action: RemoteStoreAction }>
      ): Generator<ActionReturnType | CallEffect<RestClientCallReturnType>> {
        const { deploymentUuid, action } = p.payload;
        try {
          log.info("handleRemoteStoreAction on action",action);
          const clientResult: RestClientCallReturnType
           = yield* call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreAction(deploymentUuid, action)
          );
          log.debug("handleRemoteStoreAction received clientResult", clientResult);

            if (action.actionType == "RemoteStoreCRUDAction") {
              const result:ActionReturnType = {
                status: "ok",
                returnedDomainElement: {
                  elementType: "entityInstanceCollection",
                  elementValue: {
                    parentUuid: action.parentUuid??"", // TODO: action.parentUuid should not be optional!
                    applicationSection: action.section,
                    instances: clientResult.data.instances
                  }
                }
              };
              log.debug("handleRemoteStoreAction received result", result.status);
              return yield result;
            } else {
              const result: ActionReturnType = {
              status: "ok",
              returnedDomainElement: { elementType: "void" }
            }
            log.debug("handleRemoteStoreAction received result", result.status);
            return yield result;
          };
        } catch (e: any) {
          log.error("handleRemoteStoreAction exception", e);
          const result: ActionReturnType = {
            status: "error",
            error: {
              errorType: "FailedToDeployModule",  // TODO: correct errorType!
              errorMessage: e["message"],
              error: { errorMessage: e["message"], stack: [e["message"]] },
            }
          };
          return result;
        }
      }.bind(this),
    },
  };

  //#########################################################################################
  public *instanceRootSaga() {
    yield all([
      ...Object.values(this.remoteStoreRestAccessSagaInputPromiseActions).map((a: any) =>
        takeEvery(a.creator, handlePromiseActionForSaga(a.generator))
      ),
    ]);
  }
}// end class RemoteStoreRestAccessReduxSaga

export default RemoteStoreRestAccessReduxSaga;

