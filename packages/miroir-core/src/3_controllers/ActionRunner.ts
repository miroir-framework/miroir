import {
  StoreOrBundleAction,
  ModelAction,
  ModelActionInitModel,
  ModelActionInitModelParams,
  ActionReturnType
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";

import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary";
import applicationDeploymentMiroir from "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";

import { startLocalPersistenceStoreControllers } from "../4_services/PersistenceStoreControllerTools.js";
import { ACTION_OK } from "../1_core/constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "ActionRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ################################################################################################
/**
 * runs a model action: "modelActionUpdateEntity" ("create", "update" or "delete" an Entity), "resetModel" to start again from scratch, etc.
 * @param deploymentUuid
 * @param actionName
 * @param miroirDataPersistenceStoreController
 * @param appDataPersistenceStoreController
 * @param body
 * @returns
 */
export async function modelActionStoreRunnerNotUsed(
  miroirDataPersistenceStoreController: PersistenceStoreControllerInterface,
  appDataPersistenceStoreController: PersistenceStoreControllerInterface,
  deploymentUuid: string,
  actionName: string,
  body: any
): Promise<ActionReturnType> {
  log.info(
    "###################################### modelActionStoreRunnerNotUsed started deploymentUuid",
    deploymentUuid,
    "actionName",
    actionName
  );
  log.debug("modelActionStoreRunnerNotUsed getEntityUuids()", miroirDataPersistenceStoreController.getEntityUuids());
  const persistenceStoreController: PersistenceStoreControllerInterface =
    deploymentUuid == applicationDeploymentMiroir.uuid ? miroirDataPersistenceStoreController : appDataPersistenceStoreController;
  const modelAction: ModelAction = body;
  // log.info('modelActionStoreRunnerNotUsed action', JSON.stringify(update,undefined,2));
  log.info("modelActionStoreRunnerNotUsed action", modelAction);
  switch (modelAction.actionName) {
    case "alterEntityAttribute":
    case "createEntity":
    case "renameEntity": 
    case "resetData":
    case "dropEntity": {
      await persistenceStoreController.handleAction(modelAction)
      break;
    }
    case "resetModel": {
      log.debug("modelActionStoreRunnerNotUsed resetModel update");
      await miroirDataPersistenceStoreController.handleAction(modelAction)
      await appDataPersistenceStoreController.handleAction(modelAction)
      log.trace("modelActionStoreRunnerNotUsed resetModel after dropped entities:", miroirDataPersistenceStoreController.getEntityUuids());
      break;
    }
    case "initModel": {
      const modelActionInitModel = body as ModelActionInitModel;
      const params: ModelActionInitModelParams = modelActionInitModel.params;
      log.debug("modelActionStoreRunnerNotUsed initModel params", params);

      if (params.dataStoreType == "miroir") {
        await miroirDataPersistenceStoreController.handleAction(modelActionInitModel)
      } else {
        await appDataPersistenceStoreController.handleAction(modelActionInitModel)
      }
      break;
    }
    case "commit":
    case "rollback": {
      throw new Error("modelActionStoreRunnerNotUsed could not handle action" + JSON.stringify(modelAction));
    }
    default:
      log.warn("modelActionStoreRunnerNotUsed could not handle actionName", actionName);
      break;
  }
  log.debug("modelActionStoreRunnerNotUsed returning empty response.");
  return Promise.resolve(ACTION_OK);
}

// ################################################################################################
/**
 * runs a model action: "modelActionUpdateEntity" ("create", "update" or "delete" an Entity), "resetModel" to start again from scratch, etc.
 * @param actionName
 * @param action
 * @returns
 */
export async function storeActionOrBundleActionStoreRunner(
  actionName: string,
  action: StoreOrBundleAction,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface
): Promise<ActionReturnType> {
  log.info("###################################### storeActionOrBundleActionStoreRunner started ", "actionName", actionName);
  // log.debug('storeActionOrBundleActionStoreRunner getEntityUuids()', miroirDataStoreProxy.getEntityUuids());
  // const update: StoreManagementAction = action;

  log.info("storeActionOrBundleActionStoreRunner action", JSON.stringify(action, undefined, 2));
  switch (action.actionName) {
    // case "createBundle":
    // case "deleteBundle":
    //   break;
    case "createStore": {
      // log.warn("storeActionOrBundleActionStoreRunner createStore does nothing!")
      if (!action.deploymentUuid) {
        return {
          status: "error",
          error: {
            errorType: "FailedToCreateStore",
            errorMessage: "storeActionOrBundleActionStoreRunner no deploymentUuid in action " + JSON.stringify(action),
          },
        };
      }

      const localAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);
      if (!localAppPersistenceStoreController) {
        throw new Error("could not find controller:" + localAppPersistenceStoreController);
      }

      // await persistenceStoreControllerManager.addPersistenceStoreController(action.deploymentUuid, action.configuration)
      const miroirModelStoreCreated: ActionReturnType = await localAppPersistenceStoreController.createStore(action.configuration.model)
      const miroirDataStoreCreated: ActionReturnType = await localAppPersistenceStoreController.createStore(action.configuration.data)
      // const libraryModelStoreCreated: ActionReturnType = await localMiroirPersistenceStoreController.createStore(miroirConfig.client.appServerConfig.model)
      // const libraryDataStoreCreated: ActionReturnType = await localMiroirPersistenceStoreController.createStore(miroirConfig.client.appServerConfig.data)

      // .createStore(miroirConfig.client.miroirServerConfig.model)
      if (miroirModelStoreCreated.status != "ok" || miroirDataStoreCreated.status != "ok") {
        return {
          status: "error",
          error: {
            errorType: "FailedToCreateStore",
            errorMessage:
              (miroirModelStoreCreated.status != "ok" ? miroirModelStoreCreated.error : "model store created OK") +
              " --- " +
              (miroirDataStoreCreated.status != "ok" ? miroirDataStoreCreated.error : "data store created OK"),
          },
        };
      }
      break;
    }
    case "deleteStore": {
      // log.warn("storeActionOrBundleActionStoreRunner deleteStore does nothing!")
      if (!action.deploymentUuid) {
        return {
          status: "error",
          error: {
            errorType: "FailedToDeleteStore",
            errorMessage: "storeActionOrBundleActionStoreRunner no deploymentUuid in action " + JSON.stringify(action),
          },
        };
      }

      const localAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);
      if (!localAppPersistenceStoreController) {
        throw new Error("could not find controller:" + localAppPersistenceStoreController);
      }

      // await persistenceStoreControllerManager.addPersistenceStoreController(action.deploymentUuid, action.configuration)
      const miroirModelStoreDeleted: ActionReturnType = await localAppPersistenceStoreController.deleteStore(action.configuration.model)
      const miroirDataStoreDeleted: ActionReturnType = await localAppPersistenceStoreController.deleteStore(action.configuration.data)

      if (miroirModelStoreDeleted.status != "ok" || miroirDataStoreDeleted.status != "ok") {
        return {
          status: "error",
          error: {
            errorType: "FailedToDeleteStore",
            errorMessage:
              (miroirModelStoreDeleted.status != "ok" ? miroirModelStoreDeleted.error : "model store deleted OK") +
              " --- " +
              (miroirDataStoreDeleted.status != "ok" ? miroirDataStoreDeleted.error : "data store deleted OK"),
          },
        };
      }
      break;
    }
    case "openStore": {
      // log.info('storeActionOrBundleActionStoreRunner openStore',miroirConfig);

      // TODO: NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      // TODO: addPersistenceStoreController takes deploymentUuid, not ApplicationSection as 1st parameter!
      await persistenceStoreControllerManager.deletePersistenceStoreController(applicationDeploymentMiroir.uuid);
      await persistenceStoreControllerManager.deletePersistenceStoreController(applicationDeploymentLibrary.uuid);
      await persistenceStoreControllerManager.addPersistenceStoreController(
        applicationDeploymentMiroir.uuid,
        action.configuration[applicationDeploymentMiroir.uuid]
      );
      await persistenceStoreControllerManager.addPersistenceStoreController(
        applicationDeploymentLibrary.uuid,
        action.configuration[applicationDeploymentLibrary.uuid]
      );
      // }
      const localMiroirPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(applicationDeploymentMiroir.uuid);
      const localAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(applicationDeploymentLibrary.uuid);
      if (!localMiroirPersistenceStoreController || !localAppPersistenceStoreController) {
        throw new Error("could not find controller:" + localMiroirPersistenceStoreController + " " + localAppPersistenceStoreController);
      }

      await startLocalPersistenceStoreControllers(localMiroirPersistenceStoreController, localAppPersistenceStoreController);

      log.info("storeActionOrBundleActionStoreRunner openStore DONE!", persistenceStoreControllerManager.getPersistenceStoreControllers());

      break;
    }
    case "closeStore": {
      log.info("storeActionOrBundleActionStoreRunner closeStore");
      // NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      await persistenceStoreControllerManager.deletePersistenceStoreController(applicationDeploymentLibrary.uuid);
      await persistenceStoreControllerManager.deletePersistenceStoreController(applicationDeploymentMiroir.uuid);

      log.info("storeActionOrBundleActionStoreRunner closeStore DONE!", persistenceStoreControllerManager.getPersistenceStoreControllers());

      break;
    }
    default:
      log.warn("storeActionOrBundleActionStoreRunner could not handle actionName", actionName);
      break;
  }
  log.debug("storeActionOrBundleActionStoreRunner returning empty response.");
  return Promise.resolve(ACTION_OK);
}
