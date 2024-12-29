import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  SagaPromiseActionCreator,
  promiseActionFactory
} from "@teroneko/redux-saga-promise";
import { AllEffect, CallEffect, Effect, all as allEffect } from 'redux-saga/effects';
import { all, call, takeEvery } from "typed-redux-saga";
import sagaMiddleware from 'redux-saga';

import {
  ACTION_OK,
  ActionReturnType,
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceAction,
  PersistenceStoreLocalOrRemoteInterface,
  PersistenceStoreControllerAction,
  PersistenceStoreControllerManagerInterface,
  RestClientCallReturnType,
  RestPersistenceClientAndRestClientInterface,
  getLoggerName,
  storeActionOrBundleActionStoreRunner,
  PersistenceStoreControllerInterface,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryWithExtractorCombinerTransformer,
  StoreOrBundleAction,
  LocalCacheAction
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
export type PersistenceReduxSagaReturnType =
  | ActionReturnType
  | CallEffect<ActionReturnType>
  | CallEffect<RestClientCallReturnType>;

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
export type PersistenceStoreAccessParams = {
  persistenceStoreAccessMode: "local",
  localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface
} | {
  persistenceStoreAccessMode: "remote",
  localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface // TODO: remove, remote saga should not have access to local store controller when persistenceStoreAccessMode is remote
  remotePersistenceStoreRestClient: RestPersistenceClientAndRestClientInterface
};

/**
 * handles calls to the persistence store controller, either local or remote
 * 
 * This produces a weird architecture, where the persistence store is accessed through a saga,
 * because the redux store "imposes" to make asynchronous calls through sagas,
 * which may have side-effects on the local cache / redux store (data is loaded this way from the Persistent store).
 * 
 * TODO: even PersistenceReduxSagas which do not have access to the local store controller (params.persistenceStoreAccessMode == "remote")
 * need to receive one, although they use it only to dispach events.
 * This is akward, at best. Could a localCache be created internally instead of being passed as a parameter in such case? This would clarify the interface.
 * 
 */
export class PersistenceReduxSaga implements PersistenceStoreLocalOrRemoteInterface {
  // TODO:!!!!!!!!!!! Model instances or data instances? They must be treated differently regarding to caching, transactions, undo/redo, etc.
  // TODO: do not use client directly, it is a dependence on implementation. Use an interface to hide Rest/graphql implementation.
  private localCache: LocalCache | undefined;
  public sagaMiddleware: any;
  // private sagaMiddleware: any;

  constructor(
    // TODO: either remoteStoreNetworkClient or persistenceStoreControllerManager must be defined, not both! Force this distinction in the constructor.
    private params: PersistenceStoreAccessParams
  ) {
    this.sagaMiddleware = (sagaMiddleware as any)();
  }

  //#########################################################################################
  public *persistenceRootSaga() {
    yield all([
      ...Object.values(this.persistenceActionReduxSaga).map((a: any) =>
        takeEvery(a.creator, handlePromiseActionForSaga(a.generator))
      ),
    ]);
  }

  // ###############################################################################
  private *rootSaga(): Generator<AllEffect<any>, void, unknown> {
    // log.info("LocalCache rootSaga running", this.PersistenceReduxSaga);
    yield allEffect([this.persistenceRootSaga()]);
  }

  // ###############################################################################
  public getSagaMiddleware()  {
    return this.sagaMiddleware;
  }

  // ###############################################################################
  public run(localCache: LocalCache): void {
    this.localCache = localCache;
    this.sagaMiddleware.run(this.rootSaga.bind(this));
  }

  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  handleLocalCacheAction(action: LocalCacheAction): ActionReturnType {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handleLocalCacheAction localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handleLocalCacheAction!"
      );
    }
    const result: ActionReturnType = this.localCache.handleLocalCacheAction(action);
    // log.info("PersistenceReduxSaga handleLocalCacheAction", action, "returned", result)
    return result;
    // return Promise.resolve(result);
  }

  // ###############################################################################
  async handlePersistenceActionForLocalCache(action: PersistenceAction): Promise<ActionReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersistenceActionForLocalCache localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    switch (action.actionType) {
      case 'modelAction':
      case 'instanceAction':
      case 'LocalPersistenceAction':
      case 'RestPersistenceAction':
      case 'bundleAction':
      case 'storeManagementAction': {
        throw new Error(
          "PersistenceReduxSaga handlePersistenceActionForLocalCache should not be used to handle action " + JSON.stringify(action) + " please use handleStoreOrBundleActionForLocalStore instead!"
        );
      }
      case 'runBoxedExtractorOrQueryAction': {
        const result: ActionReturnType = this.localCache.runBoxedExtractorOrQueryAction(action);
        // log.info("PersistenceReduxSaga handleLocalCacheAction", action, "returned", result)
        return result;
        break;
      }
      case 'runBoxedExtractorAction':
      case 'runBoxedQueryAction':
      case 'runBoxedQueryTemplateAction':
      case 'runBoxedExtractorTemplateAction':
      case 'runBoxedQueryTemplateOrBoxedExtractorTemplateAction':
      default: {
        throw new Error(
          "PersistenceReduxSaga handlePersistenceActionForLocalCache could not handle action " + JSON.stringify(action)
        );
        break;
      }
    }
  }

  // ###############################################################################
  async handlePersistenceAction(action: PersistenceAction): Promise<ActionReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersitentAction localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const result: ActionReturnType = await this.localCache.dispatchToReduxStore(
      this.persistenceActionReduxSaga.handlePersistenceAction.creator({action})
    );
    // log.info("LocalCache handleRemoteStoreModelAction", action, "returned", result)
    return Promise.resolve(result);
  }
  
  // ###############################################################################
  async handleStoreOrBundleActionForLocalStore(action: StoreOrBundleAction): Promise<ActionReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersitentAction localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const result: ActionReturnType = await this.localCache.dispatchToReduxStore(
      this.persistenceActionReduxSaga.handleStoreOrBundleActionForLocalStore.creator({action})
    );
    // log.info("LocalCache handleStoreOrBundleActionForLocalStore", action, "returned", result)
    return Promise.resolve(result);
  }
  
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  async handlePersistenceActionForRemoteStore(action: PersistenceAction): Promise<ActionReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersistenceActionForRemoteStore localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const result: ActionReturnType = await this.localCache.dispatchToReduxStore(
      this.persistenceActionReduxSaga.handlePersistenceActionForRemoteStore.creator({action})
    );
    // log.info("LocalCache handlePersistenceActionForRemoteStore", action, "returned", result)
    return Promise.resolve(result);
  }
  
  async handlePersistenceActionForLocalPersistenceStore(action: PersistenceAction): Promise<ActionReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersistenceActionForRemoteStore localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const result: ActionReturnType = await this.localCache.dispatchToReduxStore(
      this.persistenceActionReduxSaga.handlePersistenceActionForLocalPersistenceStore.creator({action})
    );
    // log.info("LocalCache handlePersistenceActionForRemoteStore", action, "returned", result)
    return Promise.resolve(result);
  }
  
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  public* innerHandlePersistenceActionForLocalPersistenceStore(
    action: PersistenceAction,
    localPersistenceStoreController: PersistenceStoreControllerInterface | undefined,
  ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersitentActionForLocalCache localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    if (this.params.persistenceStoreAccessMode != "local") {
      throw new Error(
        "PersistenceReduxSaga handlePersitentActionForLocalCache called with persistenceStoreAccessMode = remote, this is not allowed!"
      );
    }
    if (!localPersistenceStoreController && action.actionType != "storeManagementAction") {
      throw new Error(
        "PersistenceActionReduxSaga handlePersistenceAction could not find controller for deployment: " + action.deploymentUuid
      );
    }

    // direct access to store controller, action is executed locally
    switch (action.actionType) {
      case "storeManagementAction":
      case "bundleAction": {
        throw new Error(
          "PersistenceActionReduxSaga handlePersistenceAction should not be used to handle action " + JSON.stringify(action) + " please use handleStoreOrBundleActionForLocalStore instead!"
        );
        // const result = yield* call(() =>
        //   storeActionOrBundleActionStoreRunner(
        //     action.actionName,
        //     action,
        //     localPersistenceStoreControllerManager
        //   )
        // );
        break;
      }
      case "instanceAction":
      case "modelAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid
          );
        }
        log.info("PersistenceActionReduxSaga handlePersistenceAction", JSON.stringify(action, undefined, 2));
        const localStoreResult = yield* call(() => localPersistenceStoreController.handleAction(action));
        break;
      }
      case "LocalPersistenceAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid
          );
        }
        const actionMap: {
          [k: string]: "createInstance" | "deleteInstance" | "updateInstance" | "getInstances";
        } = {
          create: "createInstance",
          delete: "deleteInstance",
          update: "updateInstance",
          read: "getInstances",
        };
        const localStoreAction: PersistenceStoreControllerAction = {
          actionType: "instanceAction",
          actionName: actionMap[action.actionName],
          applicationSection: action.section,
          parentName: action.parentName ?? "",
          parentUuid: action.parentUuid ?? "",
          deploymentUuid: action.deploymentUuid,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              // type issue: read action does not have "objects" attribute
              parentName: action.parentName ?? "",
              parentUuid: action.parentUuid ?? "",
              applicationSection: action.section,
              instances: (Array.isArray(action.objects) ? action.objects : []) as EntityInstance[],
            },
          ],
        } as PersistenceStoreControllerAction;
        log.info(
          "PersistenceActionReduxSaga handlePersistenceAction handle RestPersistenceAction",
          JSON.stringify(action, undefined, 2),
          "localStoreAction=",
          JSON.stringify(localStoreAction, undefined, 2)
        );
        const localStoreResult: ActionReturnType = yield* call(() =>
          localPersistenceStoreController.handleAction(localStoreAction)
        );
        log.info(
          "PersistenceActionReduxSaga handlePersistenceAction handle RestPersistenceAction result",
          JSON.stringify(localStoreResult, undefined, 2)
        );
        return yield localStoreResult;
        break;
      }
      case "runBoxedExtractorAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleBoxedExtractorAction(action)
        );
        return yield localStoreResult;
        break;
      }
      case "runBoxedQueryAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleBoxedQueryAction(action)
        );
        return yield localStoreResult;
        break;
      }
      case "runBoxedExtractorOrQueryAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid
          );
        }
        switch (action.query.queryType) {
          case "boxedExtractorOrCombinerReturningObjectList":
          case "boxedExtractorOrCombinerReturningObject": {
            const localQuery: BoxedExtractorOrCombinerReturningObjectOrObjectList = action.query;
            const localStoreResult = yield* call(() =>
              localPersistenceStoreController.handleBoxedExtractorAction({
                actionType: "runBoxedExtractorAction",
                actionName: action.actionName,
                applicationSection: action.applicationSection,
                deploymentUuid: action.deploymentUuid,
                endpoint: action.endpoint,
                query: localQuery,
              })
            );
            return yield localStoreResult;
            break;
          }
          case "boxedQueryWithExtractorCombinerTransformer": {
            const localQuery: BoxedQueryWithExtractorCombinerTransformer = action.query;
            const localStoreResult = yield* call(() =>
              localPersistenceStoreController.handleBoxedQueryAction({
                actionType: "runBoxedQueryAction",
                actionName: action.actionName,
                applicationSection: action.applicationSection,
                deploymentUuid: action.deploymentUuid,
                endpoint: action.endpoint,
                query: localQuery,
              })
            );
            return yield localStoreResult;
            break;
          }
          default: {
            throw new Error(
              "PersistenceActionReduxSaga handlePersistenceAction could not handle action " +
                JSON.stringify(action)
            );
            break;
          }
        }
        break;
      }
      case "runBoxedQueryTemplateAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleQueryTemplateActionForServerONLY(action)
        );
        return yield localStoreResult;
        break;
      }
      case "runBoxedExtractorTemplateAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleBoxedExtractorTemplateActionForServerONLY(action)
        );
        return yield localStoreResult;
        break;
      }
      case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction": {

        if (!localPersistenceStoreController) {
          throw new Error(
            "restMethodGetHandler could not find controller for deployment: " + action.deploymentUuid
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(action)
        );
        return yield localStoreResult;
        break;
      }
      case "RestPersistenceAction":
      // case ""
      default: {
        throw new Error(
          "PersistenceActionReduxSaga handlePersistenceAction could not handle action " + JSON.stringify(action)
        );
        break;
      }
    }
    return yield ACTION_OK;
  }

  // ###############################################################################
  public* innerHandleLocalStoreOrBundleAction(
    action: StoreOrBundleAction,
    localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface, // used only in storeManagementAction and bundleAction cases
  ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersitentActionForLocalCache localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    if (this.params.persistenceStoreAccessMode != "local") {
      throw new Error(
        "PersistenceReduxSaga handlePersitentActionForLocalCache called with persistenceStoreAccessMode = remote, this is not allowed!"
      );
    }
    const result = yield* call(() =>
      storeActionOrBundleActionStoreRunner(
        action.actionName,
        action,
        localPersistenceStoreControllerManager
      )
    );

    return yield ACTION_OK;
  }

  // ###############################################################################
  public* innerHandlePersistenceActionForLocalCache(
    action: StoreOrBundleAction,
    localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface, // used only in storeManagementAction and bundleAction cases
  ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersitentActionForLocalCache localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    if (this.params.persistenceStoreAccessMode != "local") {
      throw new Error(
        "PersistenceReduxSaga handlePersitentActionForLocalCache called with persistenceStoreAccessMode = remote, this is not allowed!"
      );
    }
    const result = yield* call(() =>
      storeActionOrBundleActionStoreRunner(
        action.actionName,
        action,
        localPersistenceStoreControllerManager
      )
    );

    return yield ACTION_OK;
  }

  // ###############################################################################
  public* innerHandlePersistenceActionForRemoteStore(
    action: PersistenceAction,
    remotePersistenceStoreRestClient: RestPersistenceClientAndRestClientInterface,
  ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
    if (this.params.persistenceStoreAccessMode != "remote") {
      throw new Error(
        "PersistenceActionReduxSaga innerHandlePersistenceActionForRemoteStore called with persistenceStoreAccessMode = local, this is not allowed!" +
          JSON.stringify(action)
      );
    }
    // indirect access to a remote storeController through the network
    // log.info("handlePersistenceAction calling remoteStoreNetworkClient on action",JSON.stringify(action));
    const clientResult: RestClientCallReturnType = yield* call(() =>
      remotePersistenceStoreRestClient.handleNetworkPersistenceAction(action)
    );
    log.debug("innerHandlePersistenceActionForRemoteStore from remoteStoreNetworkClient received clientResult", clientResult);

    switch (action.actionType) {
      case "RestPersistenceAction": {
        const result: ActionReturnType = {
          status: "ok",
          returnedDomainElement: {
            elementType: "entityInstanceCollection",
            elementValue: {
              parentUuid: action.parentUuid ?? "", // TODO: action.parentUuid should not be optional!
              applicationSection: action.section,
              instances: clientResult.data.instances,
            },
          },
        };
        log.debug("handlePersistenceAction remoteStoreNetworkClient received result", result.status);
        return yield result;
        break;
      }
      case "runBoxedExtractorOrQueryAction": {
        log.info(
          "handlePersistenceAction runBoxedExtractorOrQueryAction received from remoteStoreNetworkClient clientResult",
          JSON.stringify(clientResult, undefined, 2)
        );
        log.debug(
          "handlePersistenceAction runBoxedExtractorOrQueryAction remoteStoreNetworkClient received status",
          clientResult.status
        );
        return yield clientResult.data;
        break;
      }
      case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction": {
        log.info(
          "handlePersistenceAction runBoxedQueryTemplateOrBoxedExtractorTemplateAction received from remoteStoreNetworkClient clientResult",
          clientResult
        );
        log.debug(
          "handlePersistenceAction runBoxedQueryTemplateOrBoxedExtractorTemplateAction remoteStoreNetworkClient received result",
          clientResult.status
        );
        return yield clientResult.data;
        break;
      }
      case "runBoxedExtractorAction":
      case "runBoxedQueryAction":
      case "runBoxedQueryTemplateAction":
      case "runBoxedExtractorTemplateAction": {
        log.info(
          "handlePersistenceAction runBoxedExtractorAction received from remoteStoreNetworkClient clientResult",
          clientResult
        );
        log.debug(
          "handlePersistenceAction runBoxedExtractorAction remoteStoreNetworkClient received result",
          clientResult.status
        );
        return yield clientResult.data;
        break;
      }
      case "bundleAction":
      case "instanceAction":
      case "modelAction":
      case "storeManagementAction":
      case "LocalPersistenceAction":
      default: {
        log.debug("handlePersistenceAction received result", clientResult.status);
        return yield ACTION_OK;
        break;
      }
    }
  }

  //#########################################################################################
  public persistenceActionReduxSaga: {
    handlePersistenceAction: {
      name: "handlePersistenceAction";
      creator: SagaPromiseActionCreator<
        any,
        any,
        "handlePersistenceAction",
        ActionCreatorWithPayload<any, "handlePersistenceAction">
      >;
      generator: (a: any) => PersistenceSagaGenReturnType;
    },
    handleStoreOrBundleActionForLocalStore: {
      name: "handleStoreOrBundleActionForLocalStore";
      creator: SagaPromiseActionCreator<
        any,
        any,
        "handleStoreOrBundleActionForLocalStore",
        ActionCreatorWithPayload<any, "handleStoreOrBundleActionForLocalStore">
      >;
      generator: (a: any) => PersistenceSagaGenReturnType;
    };
    // handlePersistenceActionForLocalCache: {
    //   name: "handlePersistenceActionForLocalCache";
    //   creator: SagaPromiseActionCreator<
    //     any,
    //     any,
    //     "handlePersistenceActionForLocalCache",
    //     ActionCreatorWithPayload<any, "handlePersistenceActionForLocalCache">
    //   >;
    //   generator: (a: any) => PersistenceSagaGenReturnType;
    // };
    handlePersistenceActionForRemoteStore: {
      name: "handlePersistenceActionForRemoteStore";
      creator: SagaPromiseActionCreator<
        any,
        any,
        "handlePersistenceActionForRemoteStore",
        ActionCreatorWithPayload<any, "handlePersistenceActionForRemoteStore">
      >;
      generator: (a: any) => PersistenceSagaGenReturnType;
    };
    handlePersistenceActionForLocalPersistenceStore: {
      name: "handlePersistenceActionForLocalPersistenceStore";
      creator: SagaPromiseActionCreator<
        any,
        any,
        "handlePersistenceActionForLocalPersistenceStore",
        ActionCreatorWithPayload<any, "handlePersistenceActionForLocalPersistenceStore">
      >;
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
          if (this.params.persistenceStoreAccessMode == "local") {
            const localPersistenceStoreController =
              this.params.localPersistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);

            return (
              yield *
              this.innerHandlePersistenceActionForLocalPersistenceStore(
                action,
                localPersistenceStoreController
              )
            );
          }
          if (this.params.persistenceStoreAccessMode == "remote") {
            return yield* this.innerHandlePersistenceActionForRemoteStore(action, this.params.remotePersistenceStoreRestClient);
          }

          throw new Error( // this should never happen
            "persistenceReduxSaga persistenceActionReduxSaga found neither remoteStoreNetworkClient nor persistenceStoreControllerManager for action " +
              JSON.stringify(action)
          );
        } catch (e: any) {
          log.error("handlePersistenceAction exception", e);
          const result: ActionReturnType = {
            status: "error",
            error: {
              errorType: "FailedToDeployModule", // TODO: correct errorType!
              errorMessage: e["message"],
              error: { errorMessage: e["message"], stack: [e["message"]] },
            },
          };
          return result;
        }
      }.bind(this),
    },
    handlePersistenceActionForLocalPersistenceStore: {
      name: "handlePersistenceActionForLocalPersistenceStore",
      creator: promiseActionFactory<ActionReturnType>().create<
        { action: PersistenceAction },
        "handlePersistenceActionForLocalPersistenceStore"
      >("handlePersistenceActionForLocalPersistenceStore"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{ action: PersistenceAction }>
      ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
        const { action } = p.payload;
        try {
          if (this.params.persistenceStoreAccessMode !== "local") {
            throw new Error(
              "PersistenceActionReduxSaga handlePersistenceActionForLocalPersistenceStore called with persistenceStoreAccessMode = " +
                this.params.persistenceStoreAccessMode +
                ", this is not allowed!" +
                JSON.stringify(action)
            );
          }
          const localPersistenceStoreController =
            this.params.localPersistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);

          return (
            yield *
            this.innerHandlePersistenceActionForLocalPersistenceStore(
              action,
              localPersistenceStoreController
            )
          );
        } catch (e: any) {
          log.error("handlePersistenceAction exception", e);
          const result: ActionReturnType = {
            status: "error",
            error: {
              errorType: "FailedToDeployModule", // TODO: correct errorType!
              errorMessage: e["message"],
              error: { errorMessage: e["message"], stack: [e["message"]] },
            },
          };
          return result;
        }
      }.bind(this),
    },
    handlePersistenceActionForRemoteStore: {
      name: "handlePersistenceActionForRemoteStore",
      creator: promiseActionFactory<ActionReturnType>().create<
        { action: PersistenceAction },
        "handlePersistenceActionForRemoteStore"
      >("handlePersistenceActionForRemoteStore"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{ action: PersistenceAction }>
      ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
        const { action } = p.payload;
        try {
          if (this.params.persistenceStoreAccessMode == "local") {
            throw new Error(
              "PersistenceActionReduxSaga handlePersistenceActionForRemoteStore called with persistenceStoreAccessMode = local, this is not allowed!" +
                JSON.stringify(action)
            );
          }
          return yield* this.innerHandlePersistenceActionForRemoteStore(action, this.params.remotePersistenceStoreRestClient);
        } catch (e: any) {
          log.error("handlePersistenceActionForRemoteStore exception", e);
          const result: ActionReturnType = {
            status: "error",
            error: {
              errorType: "FailedToDeployModule", // TODO: correct errorType!
              errorMessage: e["message"],
              error: { errorMessage: e["message"], stack: [e["message"]] },
            },
          };
          return result;
        }
      }.bind(this),
    },
    // handlePersistenceActionForLocalCache: {
    //   name: "handlePersistenceActionForLocalCache",
    //   creator: promiseActionFactory<ActionReturnType>().create<
    //     { action: PersistenceAction },
    //     "handlePersistenceActionForLocalCache"
    //   >("handlePersistenceActionForLocalCache"),
    //   generator: function* (
    //     this: PersistenceReduxSaga,
    //     p: PayloadAction<{ action: PersistenceAction }>
    //   ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
    //     const { action } = p.payload;
    //     // throw new Error(
    //     //   "PersistenceActionReduxSaga handlePersistenceActionForLocalCache not implemented yet!" +
    //     //     JSON.stringify(action)
    //     // );
    //     try {
    //       const localPersistenceStoreController =
    //         this.params.localPersistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);

    //       return (
    //         yield *
    //         this.innerHandlePersistenceActionForLocalPersistenceStore(
    //           action,
    //           localPersistenceStoreController
    //         )
    //       );
    //     } catch (e: any) {
    //       log.error("handlePersistenceActionForLocalCache exception", e);
    //       const result: ActionReturnType = {
    //         status: "error",
    //         error: {
    //           errorType: "FailedToDeployModule", // TODO: correct errorType!
    //           errorMessage: e["message"],
    //           error: { errorMessage: e["message"], stack: [e["message"]] },
    //         },
    //       };
    //       return result;
    //     }
    //   }.bind(this),
    // },
    handleStoreOrBundleActionForLocalStore: {
      name: "handleStoreOrBundleActionForLocalStore",
      creator: promiseActionFactory<ActionReturnType>().create<
        { action: StoreOrBundleAction },
        "handleStoreOrBundleActionForLocalStore"
      >("handleStoreOrBundleActionForLocalStore"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{ action: StoreOrBundleAction }>
      ): Generator<ActionReturnType | CallEffect<ActionReturnType> | CallEffect<RestClientCallReturnType>> {
        const { action } = p.payload;
        try {
          return (
            yield *
            this.innerHandleLocalStoreOrBundleAction(
              action,
              this.params.localPersistenceStoreControllerManager,
            )
          );
        } catch (e: any) {
          log.error("handleStoreOrBundleActionForLocalStore exception", e);
          const result: ActionReturnType = {
            status: "error",
            error: {
              errorType: "FailedToDeployModule", // TODO: correct errorType!
              errorMessage: e["message"],
              error: { errorMessage: e["message"], stack: [e["message"]] },
            },
          };
          return result;
        }
      }.bind(this),
    },
  };
}// end class PersistenceReduxSaga

export default PersistenceReduxSaga;

