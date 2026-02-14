import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {
  SagaPromiseActionCreator,
  promiseActionFactory
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { AllEffect, CallEffect, Effect, all as allEffect } from 'redux-saga/effects';
import { all, call, takeEvery } from "typed-redux-saga";

import {
  ACTION_OK,
  Action2Error,
  Action2ReturnType,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryWithExtractorCombinerTransformer,
  EntityInstance,
  LocalCacheAction,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceAction,
  PersistenceStoreControllerAction,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  PersistenceStoreLocalOrRemoteInterface,
  RestClientCallReturnType,
  RestPersistenceClientAndRestClientInterface,
  StoreOrBundleAction,
  actionsWithDeploymentInPayload,
  instanceEndpointV1,
  modelEndpointV1,
  storeActionOrBundleActionStoreRunner,
  type ApplicationDeploymentMap,
  type MiroirModelEnvironment
} from "miroir-core";
import { handlePromiseActionForSaga } from 'src/sagaTools.js';
import { packageName } from '../../constants.js';
import { LocalCache } from '../LocalCache.js';
import { cleanLevel } from '../constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceReduxSaga")
).then((logger: LoggerInterface) => {log = logger});

// export const actionsWithDeploymentInPayload = [
//   ...instanceEndpointV1.definition.actions.map(
//   (actionDef:any) => actionDef.actionParameters.actionType.definition
// ),
// ...modelEndpointV1.definition.actions.map(
//   (actionDef:any) => actionDef.actionParameters.actionType.definition
// )]

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

// export type PersistenceReduxSagaReturnType = RemoteStoreActionReturnType | RestClientCallReturnType;
export type PersistenceReduxSagaReturnType =
  | Action2ReturnType
  | CallEffect<Action2ReturnType>
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
  public getSagaMiddleware() {
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
  handleLocalCacheAction(
    action: LocalCacheAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handleLocalCacheAction localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handleLocalCacheAction!"
      );
    }
    const result: Action2ReturnType = this.localCache.handleLocalCacheAction(
      action,
      applicationDeploymentMap
    );
    // log.info("PersistenceReduxSaga handleLocalCacheAction", action, "returned", result)
    return result;
    // return Promise.resolve(result);
  }

  // ###############################################################################
  async handlePersistenceActionForLocalCache(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersistenceActionForLocalCache localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    switch (action.actionType) {
      // case 'modelAction':
      case "initModel":
      case "commit":
      case "rollback":
      case "remoteLocalCacheRollback":
      case "resetModel":
      case "resetData":
      case "alterEntityAttribute":
      case "renameEntity":
      case "createEntity":
      case "dropEntity":
      // case 'instanceAction':
      case "createInstance":
      case "deleteInstance":
      case "deleteInstanceWithCascade":
      case "updateInstance":
      case "loadNewInstancesInLocalCache":
      case "getInstance":
      case "getInstances":
      //
      case "LocalPersistenceAction_create":
      case "LocalPersistenceAction_read":
      case "LocalPersistenceAction_update":
      case "LocalPersistenceAction_delete":
      case "RestPersistenceAction_create":
      case "RestPersistenceAction_read":
      case "RestPersistenceAction_update":
      case "RestPersistenceAction_delete":
      case "bundleAction":
      // case 'storeManagementAction':
      case "storeManagementAction_createStore":
      case "storeManagementAction_deleteStore":
      case "storeManagementAction_resetAndInitApplicationDeployment":
      case "storeManagementAction_openStore":
      case "storeManagementAction_closeStore": {
        throw new Error(
          "PersistenceReduxSaga handlePersistenceActionForLocalCache should not be used to handle action " +
            JSON.stringify(action) +
            " please use handleStoreOrBundleActionForLocalStore instead!"
        );
      }
      case "runBoxedExtractorOrQueryAction": {
        const result: Action2ReturnType = this.localCache.runBoxedExtractorOrQueryAction(
          action,
          applicationDeploymentMap
        );
        // log.info("PersistenceReduxSaga handleLocalCacheAction", action, "returned", result)
        return result;
        break;
      }
      case "runBoxedExtractorAction":
      case "runBoxedQueryAction":
      case "runBoxedQueryTemplateAction":
      case "runBoxedExtractorTemplateAction":
      case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction":
      default: {
        throw new Error(
          "PersistenceReduxSaga handlePersistenceActionForLocalCache could not handle action " +
            JSON.stringify(action)
        );
        break;
      }
    }
  }

  // ###############################################################################
  async handlePersistenceAction(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersitentAction localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const result: Action2ReturnType = await this.localCache.dispatchToReduxStore(
      this.persistenceActionReduxSaga.handlePersistenceAction.creator({ action, applicationDeploymentMap })
    );
    log.info("handlePersistenceAction", action, "returned", result);
    return Promise.resolve(result);
  }

  // ###############################################################################
  async handleStoreOrBundleActionForLocalStore(
    action: StoreOrBundleAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersitentAction localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const result: Action2ReturnType = await this.localCache.dispatchToReduxStore(
      this.persistenceActionReduxSaga.handleStoreOrBundleActionForLocalStore.creator({
        action,
        applicationDeploymentMap,
      })
    );
    // log.info("LocalCache handleStoreOrBundleActionForLocalStore", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  // ###############################################################################
  // ###############################################################################
  async handlePersistenceActionForRemoteStore(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersistenceActionForRemoteStore localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const result: Action2ReturnType = await this.localCache.dispatchToReduxStore(
      this.persistenceActionReduxSaga.handlePersistenceActionForRemoteStore.creator({
        action,
        applicationDeploymentMap,
        currentModel,
      })
    );
    // log.info("LocalCache handlePersistenceActionForRemoteStore", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  async handlePersistenceActionForLocalPersistenceStore(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga handlePersistenceActionForLocalPersistenceStore localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const result: Action2ReturnType = await this.localCache.dispatchToReduxStore(
      this.persistenceActionReduxSaga.handlePersistenceActionForLocalPersistenceStore.creator({
        action,
        applicationDeploymentMap,
        currentModel,
      })
    );
    // log.info("LocalCache handlePersistenceActionForLocalPersistenceStore", action, "returned", result)
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
  public *innerHandlePersistenceActionForLocalPersistenceStore(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel: MiroirModelEnvironment | undefined,
    localPersistenceStoreController: PersistenceStoreControllerInterface | undefined
  ): Generator<
    Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>
  > {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga innerHandlePersistenceActionForLocalPersistenceStore localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    const deploymentUuid = applicationDeploymentMap[action.payload.application];
    // actionsWithDeploymentInPayload.includes(action.actionType) ? (action as any).payload.deploymentUuid : (action as any).deploymentUuid;
    log.info(
      "PersistenceReduxSaga innerHandlePersistenceActionForLocalPersistenceStore called",
      this.params.persistenceStoreAccessMode,
      "action",
      action,
      "applicationDeploymentMap",
      applicationDeploymentMap,
      "deploymentUuid", deploymentUuid
    );
    if (this.params.persistenceStoreAccessMode != "local") {
      throw new Error(
        "PersistenceReduxSaga innerHandlePersistenceActionForLocalPersistenceStore called with persistenceStoreAccessMode = remote, this is not allowed!"
      );
    }
    if (
      !localPersistenceStoreController &&
      ![
        "storeManagementAction_createStore",
        "storeManagementAction_deleteStore",
        "storeManagementAction_resetAndInitApplicationDeployment",
        "storeManagementAction_openStore",
        "storeManagementAction_closeStore",
      ].includes(action.actionType)
    ) {
      throw new Error(
        "PersistenceActionReduxSaga innerHandlePersistenceActionForLocalPersistenceStore could not find controller for deployment: " +
          deploymentUuid
      );
    }

    // direct access to store controller, action is executed locally
    switch (action.actionType) {
      // case "storeManagementAction":
      case "storeManagementAction_createStore":
      case "storeManagementAction_deleteStore":
      case "storeManagementAction_resetAndInitApplicationDeployment":
      case "storeManagementAction_openStore":
      case "storeManagementAction_closeStore":
      //
      case "bundleAction": {
        throw new Error(
          "PersistenceActionReduxSaga innerHandlePersistenceActionForLocalPersistenceStore should not be used to handle action " +
            JSON.stringify(action) +
            " please use handleStoreOrBundleActionForLocalStore instead!"
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
      // case "instanceAction":
      case "createInstance":
      case "deleteInstance":
      case "deleteInstanceWithCascade":
      case "updateInstance":
      case "loadNewInstancesInLocalCache":
      case "getInstance":
      case "getInstances":
      // case "modelAction": {
      case "initModel":
      case "commit":
      case "rollback":
      case "remoteLocalCacheRollback":
      case "resetModel":
      case "resetData":
      case "alterEntityAttribute":
      case "renameEntity":
      case "createEntity":
      case "dropEntity": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "PersistenceActionReduxSaga could not find controller for deployment: " + deploymentUuid
            // + " available controllers: " +
            // this.persistenceStoreControllerManager.getPersistenceStoreControllers()
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleAction(action, applicationDeploymentMap)
        );
        log.info(
          "PersistenceActionReduxSaga innerHandlePersistenceActionForLocalPersistenceStore done for action",
          action,
          "result=",
          localStoreResult
          // JSON.stringify(action, undefined, 2)
        );
        return localStoreResult;
        break;
      }
      case "LocalPersistenceAction_create":
      case "LocalPersistenceAction_read":
      case "LocalPersistenceAction_update":
      case "LocalPersistenceAction_delete": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "innerHandlePersistenceActionForLocalPersistenceStore could not find controller for" +
              "application: " +
              action.payload.application +
              " applicationDeploymentMap: " +
              JSON.stringify(applicationDeploymentMap, null, 2) +
              " deployment: " +
              applicationDeploymentMap[action.payload.application],
          );
        }
        const actionMap: {
          [k: string]: "createInstance" | "deleteInstance" | "updateInstance" | "getInstances";
        } = {
          create: "createInstance",
          read: "getInstances",
          update: "updateInstance",
          delete: "deleteInstance",
        };
        const newActionType = actionMap[action.actionType.split("_")[1]];
        const localStoreAction: PersistenceStoreControllerAction = {
          // actionType: "instanceAction",
          actionType: actionMap[newActionType],
          parentName: action.payload.parentName ?? "",
          parentUuid: action.payload.parentUuid ?? "",
          // deploymentUuid: action.deploymentUuid, // NOT for createInstance
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: action.payload.application,
            // deploymentUuid: action.payload.deploymentUuid, // ONLY for createInstance
            applicationSection: action.payload.section,
            objects: [
              {
                // type issue: read action does not have "objects" attribute
                parentName: action.payload.parentName ?? "",
                parentUuid: action.payload.parentUuid ?? "",
                applicationSection: action.payload.section,
                instances: (Array.isArray(action.payload.objects)
                  ? action.payload.objects
                  : []) as EntityInstance[],
              },
            ],
          },
        } as PersistenceStoreControllerAction;
        log.info(
          "PersistenceActionReduxSaga innerHandlePersistenceActionForLocalPersistenceStore handle LocalPersistenceAction",
          action,
          "localStoreAction=",
          localStoreAction
        );
        // log.info(
        //   "PersistenceActionReduxSaga innerHandlePersistenceActionForLocalPersistenceStore handle RestPersistenceAction",
        //   JSON.stringify(action, undefined, 2),
        //   "localStoreAction=",
        //   JSON.stringify(localStoreAction, undefined, 2)
        // );
        const localStoreResult: Action2ReturnType = yield* call(() =>
          localPersistenceStoreController.handleAction(localStoreAction, applicationDeploymentMap)
        );
        log.info(
          "PersistenceActionReduxSaga innerHandlePersistenceActionForLocalPersistenceStore LocalPersistenceAction result",
          localStoreResult
          // JSON.stringify(localStoreResult, undefined, 2)
        );
        return localStoreResult;
        break;
      }
      case "runBoxedExtractorAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "innerHandlePersistenceActionForLocalPersistenceStore could not find controller for deployment: " +
              deploymentUuid
          );
        }
        const localStoreResult =
          yield *
          call(() =>
            localPersistenceStoreController.handleBoxedExtractorAction(
              action,
              applicationDeploymentMap,
              currentModel
            )
          );
        return localStoreResult;
        break;
      }
      case "runBoxedQueryAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "innerHandlePersistenceActionForLocalPersistenceStore could not find controller for deployment: " +
              deploymentUuid
          );
        }
        const localStoreResult =
          yield *
          call(() =>
            localPersistenceStoreController.handleBoxedQueryAction(
              action,
              applicationDeploymentMap,
              currentModel
            )
          );
        return localStoreResult;
        break;
      }
      case "runBoxedExtractorOrQueryAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "innerHandlePersistenceActionForLocalPersistenceStore could not find controller for" +
              " application: " +
              action.payload.application +
              " applicationDeploymentMap: " +
              JSON.stringify(applicationDeploymentMap, null, 2) +
            " deployment: " +
              deploymentUuid
          );
        }
        switch (action.payload.query.queryType) {
          case "boxedExtractorOrCombinerReturningObjectList":
          case "boxedExtractorOrCombinerReturningObject": {
            const localQuery: BoxedExtractorOrCombinerReturningObjectOrObjectList =
              action.payload.query;
            const localStoreResult = yield* call(() =>
              localPersistenceStoreController.handleBoxedExtractorAction(
                {
                  actionType: "runBoxedExtractorAction",
                  application: action.application,
                  endpoint: action.endpoint,
                  payload: {
                    application: action.payload.application,
                    // deploymentUuid: action.payload.deploymentUuid,
                    applicationSection: action.payload.applicationSection,
                    query: localQuery,
                  },
                },
                applicationDeploymentMap,
                currentModel
              )
            );
            return localStoreResult;
            break;
          }
          case "boxedQueryWithExtractorCombinerTransformer": {
            const localQuery: BoxedQueryWithExtractorCombinerTransformer = action.payload.query;
            const localStoreResult = yield* call(() =>
              localPersistenceStoreController.handleBoxedQueryAction(
                {
                  actionType: "runBoxedQueryAction",
                  application: action.application,
                  endpoint: action.endpoint,
                  payload: {
                    application: action.payload.application,
                    // deploymentUuid: action.payload.deploymentUuid,
                    applicationSection: action.payload.applicationSection,
                    query: localQuery,
                  },
                },
                applicationDeploymentMap,
                currentModel
              )
            );
            return localStoreResult;
            break;
          }
          default: {
            throw new Error(
              "PersistenceActionReduxSaga innerHandlePersistenceActionForLocalPersistenceStore could not handle action " +
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
            "innerHandlePersistenceActionForLocalPersistenceStore could not find controller for application: " +
              action.payload.application +
              " applicationDeploymentMap: " +
              JSON.stringify(applicationDeploymentMap, null, 2) +
            " deployment: " +
              deploymentUuid
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleQueryTemplateActionForServerONLY(action, applicationDeploymentMap)
        );
        return localStoreResult;
        break;
      }
      case "runBoxedExtractorTemplateAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "innerHandlePersistenceActionForLocalPersistenceStore could not find controller for application: " +
              action.payload.application +
              " applicationDeploymentMap: " +
              JSON.stringify(applicationDeploymentMap, null, 2) +
              " deployment: " +
              deploymentUuid,
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleBoxedExtractorTemplateActionForServerONLY(action, applicationDeploymentMap)
        );
        return localStoreResult;
        break;
      }
      case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "innerHandlePersistenceActionForLocalPersistenceStore could not find controller for application: " +
              action.payload.application +
              " applicationDeploymentMap: " +
              JSON.stringify(applicationDeploymentMap, null, 2) +
              " deployment: " +
              deploymentUuid,
          );
        }
        const localStoreResult = yield* call(() =>
          localPersistenceStoreController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
            action,
            applicationDeploymentMap
          )
        );
        return localStoreResult;
        break;
      }
      case "RestPersistenceAction_create":
      case "RestPersistenceAction_read":
      case "RestPersistenceAction_update":
      case "RestPersistenceAction_delete":
      default: {
        throw new Error(
          "PersistenceActionReduxSaga innerHandlePersistenceActionForLocalPersistenceStore no handler found for action " +
            JSON.stringify(action)
        );
      }
    }
    // return yield ACTION_OK;
  }

  // ###############################################################################
  public *innerHandleLocalStoreOrBundleAction(
    action: StoreOrBundleAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface // used only in storeManagementAction and bundleAction cases
    // ): Generator<Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>> {
  ): Generator<
    Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>
  > {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga innerHandleLocalStoreOrBundleAction localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    if (this.params.persistenceStoreAccessMode != "local") {
      throw new Error(
        "PersistenceReduxSaga innerHandleLocalStoreOrBundleAction called with persistenceStoreAccessMode = remote, this is not allowed!"
      );
    }
    const result = yield* call(() =>
      storeActionOrBundleActionStoreRunner(
        // action.actionName,
        action.actionType,
        action,
        applicationDeploymentMap,
        localPersistenceStoreControllerManager
      )
    );

    return yield ACTION_OK;
  }

  // ###############################################################################
  public *innerHandlePersistenceActionForLocalCache(
    action: StoreOrBundleAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface // used only in storeManagementAction and bundleAction cases
  ): Generator<
    Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>
  > {
    if (!this.localCache) {
      throw new Error(
        "PersistenceReduxSaga innerHandlePersistenceActionForLocalCache localCache not defined yet, please execute instance method PersistenceReduxSaga.run(LocalCache) before calling handlePersistenceAction!"
      );
    }
    if (this.params.persistenceStoreAccessMode != "local") {
      throw new Error(
        "PersistenceReduxSaga innerHandlePersistenceActionForLocalCache called with persistenceStoreAccessMode = remote, this is not allowed!"
      );
    }
    const result = yield* call(() =>
      storeActionOrBundleActionStoreRunner(
        // action.actionName,
        action.actionType,
        action,
        applicationDeploymentMap,
        localPersistenceStoreControllerManager
      )
    );

    return yield ACTION_OK;
  }

  // ###############################################################################
  public *innerHandlePersistenceActionForRemoteStore(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    remotePersistenceStoreRestClient: RestPersistenceClientAndRestClientInterface
  ): Generator<
    Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>
  > {
    try {
      if (this.params.persistenceStoreAccessMode != "remote") {
        throw new Error(
          "PersistenceActionReduxSaga innerHandlePersistenceActionForRemoteStore called with persistenceStoreAccessMode = local, this is not allowed!" +
            JSON.stringify(action)
        );
      }
      // indirect access to a remote storeController through the network
      if (action && (action as any).actionType !== "initModel") {
        // log.info(
        //   "innerHandlePersistenceActionForRemoteStore calling remoteStoreNetworkClient on action",
        //   JSON.stringify(action, undefined, 2)
        // );
      } else {
        // log.info(
        //   "innerHandlePersistenceActionForRemoteStore calling remoteStoreNetworkClient on action",
        //   action
        // );
      }
      const clientResult: RestClientCallReturnType = yield* call(() =>
        remotePersistenceStoreRestClient.handleNetworkPersistenceAction(
          action,
          applicationDeploymentMap
        )
      );
      if (clientResult instanceof Action2Error) {
        return clientResult;
      }
      // log.info(
      //   "innerHandlePersistenceActionForRemoteStore from remoteStoreNetworkClient received clientResult",
      //   clientResult,
      //   clientResult instanceof Action2Error
      // );
      if (clientResult && [400, 401, 403, 404, 409, 422, 500, 502, 503].includes(clientResult.status as number)) {
        return new Action2Error(
          "FailedToHandleAction",
          "remote persistence store returned error status " + clientResult.status,
        );
      }
      // clientResult instanceof Action2Error === false
      if (clientResult.data.status === "error" || clientResult.data instanceof Action2Error) {
        return clientResult.data;
      }
      switch (action.actionType) {
        case "RestPersistenceAction_create":
        case "RestPersistenceAction_read":
        case "RestPersistenceAction_update":
        case "RestPersistenceAction_delete": {
          const result: Action2ReturnType = {
            status: "ok",
            returnedDomainElement: {
              parentUuid: action.payload.parentUuid ?? "", // TODO: action.parentUuid should not be optional!
              applicationSection: action.payload.section,
              instances: clientResult.data.instances,
            },
          };
          log.debug(
            "innerHandlePersistenceActionForRemoteStore remoteStoreNetworkClient received result",
            result.status
          );
          return result;
          break;
        }
        case "runBoxedExtractorOrQueryAction": {
          // log.info(
          //   "innerHandlePersistenceActionForRemoteStore runBoxedExtractorOrQueryAction received from remoteStoreNetworkClient clientResult",
          //   JSON.stringify(clientResult, undefined, 2)
          // );
          // log.debug(
          //   "innerHandlePersistenceActionForRemoteStore runBoxedExtractorOrQueryAction remoteStoreNetworkClient received status",
          //   clientResult.status
          // );
          return clientResult.data;
          break;
        }
        case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction": {
          // log.info(
          //   "handlePersistenceAction runBoxedQueryTemplateOrBoxedExtractorTemplateAction received from remoteStoreNetworkClient clientResult",
          //   clientResult
          // );
          // log.debug(
          //   "handlePersistenceAction runBoxedQueryTemplateOrBoxedExtractorTemplateAction remoteStoreNetworkClient received result",
          //   clientResult.status
          // );
          return clientResult.data;
          break;
        }
        case "runBoxedExtractorAction":
        case "runBoxedQueryAction":
        case "runBoxedQueryTemplateAction":
        case "runBoxedExtractorTemplateAction": {
          // log.info(
          //   "innerHandlePersistenceActionForRemoteStore runBoxedExtractorAction received from remoteStoreNetworkClient clientResult",
          //   clientResult
          // );
          // log.debug(
          //   "innerHandlePersistenceActionForRemoteStore runBoxedExtractorAction remoteStoreNetworkClient received result",
          //   clientResult.status
          // );
          return clientResult.data;
          break;
        }
        case "getInstance":
        case "getInstances":
        case "createInstance":
        case "deleteInstance":
        case "deleteInstanceWithCascade":
        case "updateInstance": {
          return clientResult.data as Action2ReturnType;
        }
        case "bundleAction":
        // case "instanceAction":
        case "loadNewInstancesInLocalCache":
        //
        // case "modelAction":
        case "initModel":
        case "commit":
        case "rollback":
        case "remoteLocalCacheRollback":
        case "resetModel":
        case "resetData":
        case "alterEntityAttribute":
        case "renameEntity":
        case "createEntity":
        case "dropEntity":
        // case "storeManagementAction":
        case "storeManagementAction_createStore":
        case "storeManagementAction_deleteStore":
        case "storeManagementAction_resetAndInitApplicationDeployment":
        case "storeManagementAction_openStore":
        case "storeManagementAction_closeStore":
        //
        case "LocalPersistenceAction_create":
        case "LocalPersistenceAction_read":
        case "LocalPersistenceAction_update":
        case "LocalPersistenceAction_delete":
        default: {
          // log.debug(
          //   "innerHandlePersistenceActionForRemoteStore received result",
          //   clientResult.status
          // );
          return yield ACTION_OK;
          break;
        }
      }
    } catch (error) {
      // log.info(
      //   "innerHandlePersistenceActionForRemoteStore exception",
      //   error,
      //   "for action",
      //   action,
      //   "full error:",
      //   JSON.stringify(error, undefined, 2)
      // );
      return {
        ...new Action2Error(
          "FailedToHandlePersistenceAction",
          "could not handle action " + ((action as any).actionLabel ?? action.actionType),
          [(error as any).message ?? "Unknown error"]
        ),
      };
    }
  }

  //#########################################################################################
  //#########################################################################################
  //#########################################################################################
  //#########################################################################################
  //#########################################################################################
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
    };
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

    // ###############################################################################
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
      creator: promiseActionFactory<Action2ReturnType>().create<
        {
          action: PersistenceAction;
          applicationDeploymentMap: ApplicationDeploymentMap;
          currentModel?: MiroirModelEnvironment;
        },
        "handlePersistenceAction"
      >("handlePersistenceAction"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{
          action: PersistenceAction;
          applicationDeploymentMap: ApplicationDeploymentMap;
          currentModel?: MiroirModelEnvironment;
        }>
      ): Generator<
        Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>
      > {
        const { action, applicationDeploymentMap, currentModel } = p.payload;
        // log.info(
        //   "PersistenceReduxSaga handlePersistenceAction called with persistenceStoreAccessMode =",
        //   this.params.persistenceStoreAccessMode,
        //   "action",
        //   action
        // );
        const deploymentUuid = applicationDeploymentMap[action.payload.application];
        // const deploymentUuid = actionsWithDeploymentInPayload.includes(action.actionType)
        //   ? (action as any).payload.deploymentUuid
        //   : (action as any).deploymentUuid;
        try {
          if (this.params.persistenceStoreAccessMode == "local") {
            const localPersistenceStoreController =
              this.params.localPersistenceStoreControllerManager.getPersistenceStoreController(
                deploymentUuid
              );

            if (!localPersistenceStoreController) {
              throw new Error(
                "PersistenceActionReduxSaga handlePersistenceAction could not find controller for deployment: " +
                  deploymentUuid +
                  " available controllers: " +
                  this.params.localPersistenceStoreControllerManager.getPersistenceStoreControllers()
              );
            }
            return yield* this.innerHandlePersistenceActionForLocalPersistenceStore(
              action,
              applicationDeploymentMap,
              currentModel,
              localPersistenceStoreController
            );
          }
          if (this.params.persistenceStoreAccessMode == "remote") {
            return yield* this.innerHandlePersistenceActionForRemoteStore(
              action,
              applicationDeploymentMap,
              this.params.remotePersistenceStoreRestClient
            );
          }

          throw new Error( // this should never happen
            "persistenceReduxSaga persistenceActionReduxSaga found neither remoteStoreNetworkClient nor persistenceStoreControllerManager for action " +
              JSON.stringify(action)
          );
        } catch (e: any) {
          log.error(
            "handlePersistenceAction exception",
            e,
            "for action",
            JSON.stringify(action, undefined, 2)
          );

          // Handle structured errors from REST API
          if (e.isStructuredError && e.errorData) {
            log.info("Structured error received from server:", e.errorData);
            // Dispatch snackbar action to show user-friendly error
            // Note: This requires the snackbar system to be connected to Redux
            // For now, we'll include the structured error in the result
            const result: Action2ReturnType = new Action2Error(
              e.errorData.error || "FailedToHandlePersistenceAction",
              e.errorData.message || e.message,
              e.errorData.error,
              {
                status: "error",
                errorType: e.errorData.error,
                errorMessage: "statuscode: " + e.statusCode + e.errorData.message,
                // statusCode: e.statusCode,
                errorStack: [e.errorData.message],
                // isServerError: true
              }
            );
            return result;
          }

          const result: Action2ReturnType = new Action2Error(
            "FailedToHandlePersistenceAction", // TODO: correct errorType!
            e["message"],
            e["errorType"],
            {
              status: "error",
              errorType: e["errorType"],
              errorMessage: e["message"],
              errorStack: [e["message"]],
            }
          );
          return result;
        }
      }.bind(this),
    },
    handlePersistenceActionForLocalPersistenceStore: {
      name: "handlePersistenceActionForLocalPersistenceStore",
      creator: promiseActionFactory<Action2ReturnType>().create<
        {
          action: PersistenceAction;
          applicationDeploymentMap: ApplicationDeploymentMap;
          currentModel?: MiroirModelEnvironment;
        },
        "handlePersistenceActionForLocalPersistenceStore"
      >("handlePersistenceActionForLocalPersistenceStore"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{
          action: PersistenceAction;
          applicationDeploymentMap: ApplicationDeploymentMap;
          currentModel?: MiroirModelEnvironment;
        }>
      ): Generator<
        Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>
      > {
        const { action, applicationDeploymentMap, currentModel } = p.payload;
        const deploymentUuid = applicationDeploymentMap[action.payload.application];
        // const deploymentUuid = actionsWithDeploymentInPayload.includes(action.actionType)
        //   ? (action as any).payload.deploymentUuid
        //   : (action as any).deploymentUuid;
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
            this.params.localPersistenceStoreControllerManager.getPersistenceStoreController(
              deploymentUuid
            );

          return yield* this.innerHandlePersistenceActionForLocalPersistenceStore(
            action,
            applicationDeploymentMap,
            currentModel,
            localPersistenceStoreController
          );
        } catch (e: any) {
          log.error("handlePersistenceAction exception", e);

          const result: Action2ReturnType = new Action2Error(
            "FailedToHandlePersistenceActionForLocalPersistenceStore", // TODO: correct errorType!
            e["message"],
            e["errorType"],
            {
              status: "error",
              errorType: e["errorType"],
              errorMessage: e["message"],
              errorStack: [e["message"]],
            }
          );
          return result;
        }
      }.bind(this),
    },
    handlePersistenceActionForRemoteStore: {
      name: "handlePersistenceActionForRemoteStore",
      creator: promiseActionFactory<Action2ReturnType>().create<
        {
          action: PersistenceAction;
          applicationDeploymentMap: ApplicationDeploymentMap;
          currentModel?: MiroirModelEnvironment;
        },
        "handlePersistenceActionForRemoteStore"
      >("handlePersistenceActionForRemoteStore"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{
          action: PersistenceAction;
          applicationDeploymentMap: ApplicationDeploymentMap;
          currentModel?: MiroirModelEnvironment;
        }>
      ): Generator<
        Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>
      > {
        const { action, applicationDeploymentMap, currentModel } = p.payload;
        try {
          if (this.params.persistenceStoreAccessMode == "local") {
            throw new Error(
              "PersistenceActionReduxSaga handlePersistenceActionForRemoteStore called with persistenceStoreAccessMode = local, this is not allowed!" +
                JSON.stringify(action)
            );
          }
          return yield* this.innerHandlePersistenceActionForRemoteStore(
            action,
            applicationDeploymentMap,
            this.params.remotePersistenceStoreRestClient
          );
        } catch (e: any) {
          log.error("handlePersistenceActionForRemoteStore exception", e);

          const result: Action2ReturnType = new Action2Error(
            "FailedToDeployModule", // TODO: correct errorType!
            e["message"],
            e["errorType"],
            {
              status: "error",
              errorType: e["errorType"],
              errorMessage: e["message"],
              errorStack: [e["message"]],
            }
          );
          return result;
        }
      }.bind(this),
    },
    handleStoreOrBundleActionForLocalStore: {
      name: "handleStoreOrBundleActionForLocalStore",
      creator: promiseActionFactory<Action2ReturnType>().create<
        { action: StoreOrBundleAction; applicationDeploymentMap: ApplicationDeploymentMap },
        "handleStoreOrBundleActionForLocalStore"
      >("handleStoreOrBundleActionForLocalStore"),
      generator: function* (
        this: PersistenceReduxSaga,
        p: PayloadAction<{
          action: StoreOrBundleAction;
          applicationDeploymentMap: ApplicationDeploymentMap;
        }>
      ): Generator<
        Action2ReturnType | CallEffect<Action2ReturnType> | CallEffect<RestClientCallReturnType>
      > {
        const { action, applicationDeploymentMap } = p.payload;
        try {
          return yield* this.innerHandleLocalStoreOrBundleAction(
            action,
            applicationDeploymentMap,
            this.params.localPersistenceStoreControllerManager
          );
        } catch (e: any) {
          log.error("handleStoreOrBundleActionForLocalStore exception", e);
          const result: Action2ReturnType = new Action2Error(
            "FailedToDeployModule", // TODO: correct errorType!
            e["message"],
            e["errorType"],
            {
              status: "error",
              errorType: e["errorType"],
              errorMessage: e["message"],
              errorStack: [e["message"]],
            }
          );
          return result;
        }
      }.bind(this),
    },
  };
}// end class PersistenceReduxSaga

export default PersistenceReduxSaga;

