import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  SagaPromiseActionCreator,
  promiseActionFactory
} from "@teroneko/redux-saga-promise";
import { CallEffect, Effect } from 'redux-saga/effects';
import { all, call, takeEvery } from "typed-redux-saga";

import {
  ACTION_OK,
  ActionReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceAction,
  RemoteStoreActionReturnType,
  RestClientCallReturnType,
  RestPersistenceClientAndRestClientInterface,
  StoreControllerManagerInterface,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  getLoggerName,
  storeActionOrBundleActionStoreRunner
} from "miroir-core";
import { handlePromiseActionForSaga } from 'src/sagaTools';
import { packageName } from '../../constants';
import { cleanLevel } from '../constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"PersistenceActionReduxSaga");
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
    private remoteStoreNetworkClient: RestPersistenceClientAndRestClientInterface | undefined,
    private storeControllerManager?: StoreControllerManagerInterface | undefined,
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
        { action: PersistenceAction },
        "handlePersistenceAction"
      >("handlePersistenceAction"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{ action: PersistenceAction }>
      ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
        const { action } = p.payload;
        try {
          if (this.storeControllerManager) {
          
            switch (action.actionType) {
              case 'storeManagementAction':
              case 'bundleAction': {
                const result = yield* call(() =>storeActionOrBundleActionStoreRunner(action.actionName,
                  action,
                  this.storeControllerManager as StoreControllerManagerInterface,
                ));
                break;
              }
              case 'instanceAction':
              case 'modelAction': {
                const localMiroirStoreController = this.storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
                const localAppStoreController = this.storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);

                if (!localMiroirStoreController || !localAppStoreController) {
                  throw new Error("restMethodGetHandler could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
                } 
                    if (action.deploymentUuid == applicationDeploymentMiroir.uuid) {
                  const localStoreResult = yield* call(() =>localMiroirStoreController.handleAction(action));
                } else {
                  const localStoreResult = yield* call(() =>localAppStoreController.handleAction(action));
                }
                break;
              }
              case 'RestPersistenceAction':
              default: {
                throw new Error("PersistenceActionReduxSaga handlePersistenceAction could not handle action " + JSON.stringify(action));
                break;
              }
            }
            return yield ACTION_OK;
          }

          if (this.remoteStoreNetworkClient != undefined) {
            log.info("handlePersistenceAction on action",JSON.stringify(action));
            const clientResult: RestClientCallReturnType
             = yield* call(() =>
              (this.remoteStoreNetworkClient as RestPersistenceClientAndRestClientInterface).handleNetworkPersistenceAction(action)
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
              log.debug("handlePersistenceAction received result", clientResult.status);
              return yield ACTION_OK;
            };
          }
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

