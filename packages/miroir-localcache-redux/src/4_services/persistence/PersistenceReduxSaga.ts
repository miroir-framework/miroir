import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  SagaPromiseActionCreator,
  promiseActionFactory
} from "@teroneko/redux-saga-promise";
import { AllEffect, CallEffect, Effect, all as allEffect } from 'redux-saga/effects';
import { all, call, takeEvery } from "typed-redux-saga";

import {
  ACTION_OK,
  ActionReturnType,
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceAction,
  PersistenceInterface,
  PersistenceStoreControllerAction,
  PersistenceStoreControllerManagerInterface,
  RestClientCallReturnType,
  RestPersistenceClientAndRestClientInterface,
  getLoggerName,
  storeActionOrBundleActionStoreRunner
} from "miroir-core";
import { handlePromiseActionForSaga } from 'src/sagaTools.js';
import { packageName } from '../../constants.js';
import { LocalCache } from '../LocalCache.js';
import { cleanLevel } from '../constants.js';

const loggerName: string = getLoggerName(packageName, cleanLevel,"PersistenceActionReduxSaga");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

// export type PersistenceReduxSagaReturnType = RemoteStoreActionReturnType | RestClientCallReturnType;
export type PersistenceReduxSagaReturnType = ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>;

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
export class PersistenceReduxSaga implements PersistenceInterface {
  // TODO:!!!!!!!!!!! Model instances or data instances? They must be treated differently regarding to caching, transactions, undo/redo, etc.
  // TODO: do not use client directly, it is a dependence on implementation. Use an interface to hide Rest/graphql implementation.
  private localCache: LocalCache | undefined;

  constructor(
    private remoteStoreNetworkClient: RestPersistenceClientAndRestClientInterface | undefined,
    private persistenceStoreControllerManager?: PersistenceStoreControllerManagerInterface | undefined,
  ) {}

  //#########################################################################################
  public *persistenceRootSaga() {
    yield all([
      ...Object.values(this.persistenceActionReduxSaga).map((a: any) =>
        takeEvery(a.creator, handlePromiseActionForSaga(a.generator))
      ),
    ]);
  }

  // ###############################################################################
  private *rootSaga():Generator<AllEffect<any>, void, unknown> {
    // log.info("LocalCache rootSaga running", this.PersistenceReduxSaga);
    yield allEffect([this.persistenceRootSaga()]);
  }

  // ###############################################################################
  public run(localCache: LocalCache): void {
    this.localCache = localCache;
    localCache.sagaMiddleware.run(this.rootSaga.bind(this));
  }
  
  // ###############################################################################
  async handlePersistenceAction(
    // deploymentUuid: string,
    action: PersistenceAction,
  ): Promise<ActionReturnType> {
    if (this.localCache) {
      const result: ActionReturnType = await this.localCache.innerReduxStore.dispatch(
        // persistent store access is accomplished through asynchronous sagas
        this.persistenceActionReduxSaga.handlePersistenceAction.creator( { action } ));
      // log.info("LocalCache handleRemoteStoreModelAction", action, "returned", result)
      return Promise.resolve(result);
    } else {
      throw new Error("PersistenceReduxSaga handlePersitentAction localCache not defined yet!");
    }
  }

  //#########################################################################################
  public persistenceActionReduxSaga: {
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
          if (this.persistenceStoreControllerManager) { // direct access to store controller, action is executed locally
          
            switch (action.actionType) {
              case 'storeManagementAction':
              case 'bundleAction': {
                const result = yield* call(() =>storeActionOrBundleActionStoreRunner(action.actionName,
                  action,
                  this.persistenceStoreControllerManager as PersistenceStoreControllerManagerInterface,
                ));
                break;
              }
              case 'instanceAction':
              case 'modelAction': {
                const localPersistenceStoreController =
                  this.persistenceStoreControllerManager.getPersistenceStoreController(
                    action.deploymentUuid
                  );

                if (!localPersistenceStoreController) {
                  throw new Error("restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid);
                } 
                const localStoreResult = yield* call(() =>localPersistenceStoreController.handleAction(action));
                break;
              }
              case 'RestPersistenceAction': {
                const localPersistenceStoreController = this.persistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);

                if (!localPersistenceStoreController) {
                  throw new Error("restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid);
                } 
                const actionMap: {[k: string]: "createInstance" | "deleteInstance" | "updateInstance" | "getInstances"} = {
                  "create": "createInstance",
                  "delete": "deleteInstance",
                  "update": "updateInstance",
                  "read": "getInstances"
                }
                const localStoreAction: PersistenceStoreControllerAction = {
                  actionType: "instanceAction",
                  actionName: actionMap[action.actionName],
                  applicationSection: action.section,
                  parentName: action.parentName??"",
                  parentUuid: action.parentUuid??"",
                  deploymentUuid: action.deploymentUuid,
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  objects: [{ // type issue: read action does not have "objects" attribute
                    parentName: action.parentName??"",
                    parentUuid: action.parentUuid??"",
                    applicationSection:action.section,
                    instances: (Array.isArray(action.objects)?action.objects:[]) as EntityInstance[]
                  }]
                } as PersistenceStoreControllerAction
                log.info(
                  "PersistenceActionReduxSaga handlePersistenceAction handle RestPersistenceAction",
                  JSON.stringify(action, undefined, 2),
                  "localStoreAction=",
                  JSON.stringify(localStoreAction, undefined, 2)
                );
                const localStoreResult: ActionReturnType = yield* call(() =>localPersistenceStoreController.handleAction(localStoreAction));
                log.info("PersistenceActionReduxSaga handlePersistenceAction handle RestPersistenceAction result", JSON.stringify(localStoreResult, undefined, 2))
                return yield localStoreResult;
                break;
              }
              case 'queryAction':
              default: {
                throw new Error("PersistenceActionReduxSaga handlePersistenceAction could not handle action " + JSON.stringify(action));
                break;
              }
            }
            return yield ACTION_OK;
          }

          if (this.remoteStoreNetworkClient != undefined) { // indirect access to a remote storeController through the network
            // log.info("handlePersistenceAction calling remoteStoreNetworkClient on action",JSON.stringify(action));
            const clientResult: RestClientCallReturnType
             = yield* call(() =>
              (this.remoteStoreNetworkClient as RestPersistenceClientAndRestClientInterface).handleNetworkPersistenceAction(action)
            );
            log.debug("handlePersistenceAction from remoteStoreNetworkClient received clientResult", clientResult);
  
            switch (action.actionType) {
              case 'RestPersistenceAction': {
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
                log.debug("handlePersistenceAction remoteStoreNetworkClient received result", result.status);
                return yield result;
                break;
              }
              case 'queryAction': {
                // log.info("handlePersistenceAction calling remoteStoreNetworkClient on action",JSON.stringify(action));
                const clientResult: RestClientCallReturnType = yield* call(() =>
                  (this.remoteStoreNetworkClient as RestPersistenceClientAndRestClientInterface).handleNetworkPersistenceAction(action)
                );
                log.info("handlePersistenceAction received from remoteStoreNetworkClient clientResult", clientResult);
                log.debug("handlePersistenceAction remoteStoreNetworkClient received result", clientResult.status);
                return yield clientResult.data;
    
                break;
              }
              case 'bundleAction':
              case 'instanceAction':
              case 'modelAction':
              case 'storeManagementAction':
              default: {
                log.debug("handlePersistenceAction received result", clientResult.status);
                return yield ACTION_OK;
                break;
              }
            }
          } else {
            throw new Error(
              "persistenceReduxSaga persistenceActionReduxSaga found neither remoteStoreNetworkClient nor persistenceStoreControllerManager for action " +
                JSON.stringify(action)
            );
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

}// end class PersistenceReduxSaga

export default PersistenceReduxSaga;

