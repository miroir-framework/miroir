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
  PersistenceAction,
  RemoteStoreActionReturnType,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  getLoggerName
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

export type PersistenceReduxSagaReturnType = RemoteStoreActionReturnType | RestClientCallReturnType;

export type PersistenceSagaGenReturnType = Effect | Generator<PersistenceReduxSagaReturnType>;


export function getPersistenceActionReduxEventNames(persistenceActionNames:string[]):string[] {
  return persistenceActionNames 
    .reduce(
      (acc:string[],curr) => acc.concat([curr,'saga-' + curr,curr+'/rejected']),[]
    )
  ;
}

//#########################################################################################
//# SLICE
//#########################################################################################
export class PersistenceReduxSaga {
  // TODO:!!!!!!!!!!! Model instances or data instances? They must be treated differently regarding to caching, transactions, undo/redo, etc.
  // TODO: do not use client directly, it is a dependence on implementation. Use an interface to hide Rest/graphql implementation.
  constructor(
    private remoteStoreNetworkClient: RemoteStoreNetworkClientInterface // public mInstanceSlice:Slice,
  ) {}

  //#########################################################################################
  public PersistenceActionReduxSaga: {
    "handlePersistenceAction": {
      name: "handlePersistenceAction";
      creator: SagaPromiseActionCreator<any, any, "handlePersistenceAction", ActionCreatorWithPayload<any, "handlePersistenceAction">>;
      generator: (a: any) => PersistenceSagaGenReturnType;
    };
  } = {
    handlePersistenceAction: {
      name: "handlePersistenceAction",
      creator: promiseActionFactory<ActionReturnType>().create<
        { deploymentUuid: string; action: PersistenceAction },
        "handlePersistenceAction"
      >("handlePersistenceAction"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{ deploymentUuid: string; action: PersistenceAction }>
      ): Generator<ActionReturnType | CallEffect<RestClientCallReturnType>> {
        const { deploymentUuid, action } = p.payload;
        try {
          log.info("handlePersistenceAction on action",action);
          const clientResult: RestClientCallReturnType
           = yield* call(() =>
            this.remoteStoreNetworkClient.handleNetworkRemoteStoreAction(deploymentUuid, action)
          );
          log.debug("handlePersistenceAction received clientResult", clientResult);

            if (action.actionType == "RestPersistenceAction") {
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
              log.debug("handlePersistenceAction received result", result.status);
              return yield result;
            } else {
              const result: ActionReturnType = {
              status: "ok",
              returnedDomainElement: { elementType: "void" }
            }
            log.debug("handlePersistenceAction received result", result.status);
            return yield result;
          };
        } catch (e: any) {
          log.error("handlePersistenceAction exception", e);
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
  public *persistenceRootSaga() {
    yield all([
      ...Object.values(this.PersistenceActionReduxSaga).map((a: any) =>
        takeEvery(a.creator, handlePromiseActionForSaga(a.generator))
      ),
    ]);
  }
}// end class PersistenceReduxSaga

export default PersistenceReduxSaga;

