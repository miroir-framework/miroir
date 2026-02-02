/**
 * Persistence Async Store - replacement for PersistenceReduxSaga
 * Uses async/await instead of Redux Saga generators.
 */
import {
  ACTION_OK,
  Action2Error,
  Action2ReturnType,
  LocalCacheAction,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceAction,
  PersistenceStoreLocalOrRemoteInterface,
  StoreOrBundleAction,
  type ApplicationDeploymentMap,
  type BoxedExtractorOrCombinerReturningObjectOrObjectList,
  type BoxedQueryWithExtractorCombinerTransformer,
  type EntityInstance,
  type MiroirModelEnvironment,
  type PersistenceStoreControllerAction,
} from "miroir-core";
import type { LocalCache } from "../LocalCache.js";

const packageName = "miroir-localcache-zustand";
const cleanLevel = "5_view";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceAsyncStore")
).then((logger: LoggerInterface) => {log = logger});

// ###############################################################################
export interface PersistenceStoreAccessParams {
  persistenceStoreAccessMode: "local" | "remote";
  localPersistenceStoreControllerManager?: any; // PersistenceStoreControllerManagerInterface
  remotePersistenceStoreRestClient?: any; // RestPersistenceClientAndRestClientInterface
}

// ###############################################################################
/**
 * Async persistence store - replaces Redux Saga with async/await.
 */
export class PersistenceAsyncStore implements PersistenceStoreLocalOrRemoteInterface {
  private localCache: LocalCache | undefined;
  private params: PersistenceStoreAccessParams;

  constructor(params: PersistenceStoreAccessParams) {
    this.params = params;
    log.info("PersistenceAsyncStore constructor with params:", params.persistenceStoreAccessMode);
  }

  // ###############################################################################
  setLocalCache(localCache: LocalCache): void {
    this.localCache = localCache;
  }

  // ###############################################################################
  getLocalCache(): LocalCache | undefined {
    return this.localCache;
  }

  // ###############################################################################
  async handlePersistenceAction(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    log.info("handlePersistenceAction called with action:", action);

    try {
      if (this.params.persistenceStoreAccessMode === "local") {
        return await this.handlePersistenceActionForLocalPersistenceStore(action, applicationDeploymentMap);
      } else {
        return await this.handlePersistenceActionForRemoteStore(action, applicationDeploymentMap);
      }
    } catch (error: any) {
      log.error("handlePersistenceAction error:", error);
      return new Action2Error("FailedToHandlePersistenceAction", error.message, error.stack);
    }
  }

  // ###############################################################################
  async handleStoreOrBundleActionForLocalStore(
    action: StoreOrBundleAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    log.info("handleStoreOrBundleActionForLocalStore called");
    
    if (!this.params.localPersistenceStoreControllerManager) {
      return new Action2Error(
        "FailedToHandleAction",
        "Local persistence store controller manager not available"
      );
    }

    try {
      const result = await this.params.localPersistenceStoreControllerManager.handleAction(action);
      return result;
    } catch (error: any) {
      log.error("handleStoreOrBundleActionForLocalStore error:", error);
      return new Action2Error("FailedToHandleAction", error.message, error.stack);
    }
  }

  // ###############################################################################
  async handlePersistenceActionForLocalCache(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    log.info("handlePersistenceActionForLocalCache called");
    
    if (!this.localCache) {
      return new Action2Error(
        "FailedToHandleLocalCacheAction",
        "Local cache not available"
      );
    }

    try {
      // Convert persistence action to local cache action and handle
      const localCacheAction: LocalCacheAction = action as any; // TODO: proper conversion
      return this.localCache.handleLocalCacheAction(localCacheAction, applicationDeploymentMap);
    } catch (error: any) {
      log.error("handlePersistenceActionForLocalCache error:", error);
      return new Action2Error("FailedToHandleLocalCacheAction", error.message, error.stack);
    }
  }

  // ###############################################################################
  async handlePersistenceActionForLocalPersistenceStore(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    log.info("handlePersistenceActionForLocalPersistenceStore called", action, applicationDeploymentMap);
    
    if (!this.params.localPersistenceStoreControllerManager) {
      return new Action2Error(
        "FailedToHandlePersistenceActionForLocalPersistenceStore",
        "Local persistence store controller manager not available"
      );
    }

    try {
      const deploymentUuid = applicationDeploymentMap[(action as any).payload?.application];
      const localPersistenceStoreController = await this.params.localPersistenceStoreControllerManager
        .getPersistenceStoreController(deploymentUuid);
      
      if (!localPersistenceStoreController) {
        return new Action2Error(
          "FailedToHandlePersistenceActionForLocalPersistenceStore",
          `Store controller not found for deployment ${deploymentUuid}`
        );
      }

      // return await storeController.handleAction(action);
      switch (action.actionType) {
      case "storeManagementAction_createStore":
      case "storeManagementAction_deleteStore":
      case "storeManagementAction_resetAndInitApplicationDeployment":
      case "storeManagementAction_openStore":
      case "storeManagementAction_closeStore":
      //
      case "bundleAction": {
        throw new Error(
          "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore should not be used to handle action " +
            JSON.stringify(action) +
            " please use handleStoreOrBundleActionForLocalStore instead!"
        );
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
            "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore could not find controller for deployment: " + deploymentUuid
            // + " available controllers: " +
            // this.persistenceStoreControllerManager.getPersistenceStoreControllers()
          );
        }
        const localStoreResult = await localPersistenceStoreController.handleAction(action, applicationDeploymentMap)
        log.info(
          "PersistenceAsyncStore innerHandlePersistenceActionForLocalPersistenceStore done for action",
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
            "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore could not find controller for" +
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
          actionType: actionMap[newActionType],
          parentName: action.payload.parentName ?? "",
          parentUuid: action.payload.parentUuid ?? "",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: action.payload.application,
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
          "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore handle LocalPersistenceAction",
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
        const localStoreResult: Action2ReturnType = await localPersistenceStoreController.handleAction(localStoreAction, applicationDeploymentMap)
        log.info(
          "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore LocalPersistenceAction result",
          localStoreResult
          // JSON.stringify(localStoreResult, undefined, 2)
        );
        return localStoreResult;
        break;
      }
      case "runBoxedExtractorAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore could not find controller for deployment: " +
              deploymentUuid
          );
        }
        const localStoreResult = await localPersistenceStoreController.handleBoxedExtractorAction(
          action,
          applicationDeploymentMap,
          currentModel,
        );
        return localStoreResult;
        break;
      }
      case "runBoxedQueryAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore could not find controller for deployment: " +
              deploymentUuid
          );
        }
        const localStoreResult = await localPersistenceStoreController.handleBoxedQueryAction(
          action,
          applicationDeploymentMap,
          currentModel,
        );
        return localStoreResult;
        break;
      }
      case "runBoxedExtractorOrQueryAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore could not find controller for" +
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
            const localStoreResult = await localPersistenceStoreController.handleBoxedExtractorAction(
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
            );
            return localStoreResult;
            break;
          }
          case "boxedQueryWithExtractorCombinerTransformer": {
            const localQuery: BoxedQueryWithExtractorCombinerTransformer = action.payload.query;
            const localStoreResult = await localPersistenceStoreController.handleBoxedQueryAction(
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
            "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore could not find controller for application: " +
              action.payload.application +
              " applicationDeploymentMap: " +
              JSON.stringify(applicationDeploymentMap, null, 2) +
            " deployment: " +
              deploymentUuid
          );
        }
        const localStoreResult = await localPersistenceStoreController.handleQueryTemplateActionForServerONLY(action, applicationDeploymentMap)
        return localStoreResult;
        break;
      }
      case "runBoxedExtractorTemplateAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore could not find controller for application: " +
              action.payload.application +
              " applicationDeploymentMap: " +
              JSON.stringify(applicationDeploymentMap, null, 2) +
              " deployment: " +
              deploymentUuid,
          );
        }
            const localStoreResult = await localPersistenceStoreController.handleBoxedExtractorTemplateActionForServerONLY(action, applicationDeploymentMap)
        ;
        return localStoreResult;
        break;
      }
      case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction": {
        if (!localPersistenceStoreController) {
          throw new Error(
            "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore could not find controller for application: " +
              action.payload.application +
              " applicationDeploymentMap: " +
              JSON.stringify(applicationDeploymentMap, null, 2) +
              " deployment: " +
              deploymentUuid,
          );
        }
        const localStoreResult = await localPersistenceStoreController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
            action,
            applicationDeploymentMap
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
          "PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore no handler found for action " +
            JSON.stringify(action)
        );
      }
    }

    } catch (error: any) {
      log.error("PersistenceAsyncStore handlePersistenceActionForLocalPersistenceStore error:", error);
      return new Action2Error("FailedToHandlePersistenceActionForLocalPersistenceStore", error.message, error.stack);
    }
  }

  // ###############################################################################
  async handlePersistenceActionForRemoteStore(
    action: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    log.info("handlePersistenceActionForRemoteStore called");
    
    if (!this.params.remotePersistenceStoreRestClient) {
      return new Action2Error(
        "FailedToHandlePersistenceAction",
        "Remote persistence store REST client not available"
      );
    }

    try {
      const clientResult = await this.params.remotePersistenceStoreRestClient.handleNetworkPersistenceAction(
        action,
        applicationDeploymentMap
      );

      if (clientResult instanceof Action2Error) {
        return clientResult;
      }

      log.info("handlePersistenceActionForRemoteStore received clientResult", clientResult);

      // Check for HTTP error statuses
      if (clientResult && [400, 401, 403, 404, 409, 422, 500, 502, 503].includes(clientResult.status as number)) {
        return new Action2Error(
          "FailedToHandleAction",
          "remote persistence store returned error status " + clientResult.status,
        );
      }

      // Check for error in data
      if (clientResult.data.status === "error" || clientResult.data instanceof Action2Error) {
        return clientResult.data;
      }

      // Process result based on action type
      switch (action.actionType) {
        case "RestPersistenceAction_create":
        case "RestPersistenceAction_read":
        case "RestPersistenceAction_update":
        case "RestPersistenceAction_delete": {
          const result: Action2ReturnType = {
            status: "ok",
            returnedDomainElement: {
              parentUuid: action.payload.parentUuid ?? "",
              applicationSection: action.payload.section,
              instances: clientResult.data.instances,
            },
          };
          log.debug("handlePersistenceActionForRemoteStore received result", result.status);
          return result;
        }
        case "runBoxedExtractorOrQueryAction":
        case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction":
        case "runBoxedExtractorAction":
        case "runBoxedQueryAction":
        case "runBoxedQueryTemplateAction":
        case "runBoxedExtractorTemplateAction": {
          log.info("handlePersistenceActionForRemoteStore received query result", clientResult);
          return clientResult.data;
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
        case "loadNewInstancesInLocalCache":
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
        case "storeManagementAction_createStore":
        case "storeManagementAction_deleteStore":
        case "storeManagementAction_resetAndInitApplicationDeployment":
        case "storeManagementAction_openStore":
        case "storeManagementAction_closeStore":
        case "LocalPersistenceAction_create":
        case "LocalPersistenceAction_read":
        case "LocalPersistenceAction_update":
        case "LocalPersistenceAction_delete":
        default: {
          log.debug("handlePersistenceActionForRemoteStore received result", clientResult.status);
          return ACTION_OK;
        }
      }
    } catch (error: any) {
      log.error("handlePersistenceActionForRemoteStore error:", error);
      return new Action2Error("FailedToHandlePersistenceAction", error.message, error.stack);
    }
  }

  // ###############################################################################
  handleLocalCacheAction(
    action: LocalCacheAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType {
    log.info("handleLocalCacheAction called");
    
    if (!this.localCache) {
      return new Action2Error(
        "FailedToHandleLocalCacheAction",
        "Local cache not available"
      );
    }

    return this.localCache.handleLocalCacheAction(action, applicationDeploymentMap);
  }
}
