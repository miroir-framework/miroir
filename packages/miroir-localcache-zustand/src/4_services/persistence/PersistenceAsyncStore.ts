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
  type MiroirModelEnvironment,
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
    log.info("handlePersistenceActionForLocalPersistenceStore called");
    
    if (!this.params.localPersistenceStoreControllerManager) {
      return new Action2Error(
        "FailedToHandlePersistenceActionForLocalPersistenceStore",
        "Local persistence store controller manager not available"
      );
    }

    try {
      const deploymentUuid = applicationDeploymentMap[(action as any).payload?.application];
      const storeController = await this.params.localPersistenceStoreControllerManager
        .getPersistenceStoreController(deploymentUuid);
      
      if (!storeController) {
        return new Action2Error(
          "FailedToHandlePersistenceActionForLocalPersistenceStore",
          `Store controller not found for deployment ${deploymentUuid}`
        );
      }

      return await storeController.handleAction(action);
    } catch (error: any) {
      log.error("handlePersistenceActionForLocalPersistenceStore error:", error);
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
