import {
  StoreOrBundleAction,
  ModelAction,
  ModelActionInitModel,
  ModelActionInitModelParams
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { StoreControllerInterface } from "../0_interfaces/4-services/StoreControllerInterface.js";
import { StoreControllerManagerInterface } from "../0_interfaces/4-services/StoreControllerManagerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";

import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary";
import applicationDeploymentMiroir from "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";

import { startLocalStoreControllers } from "../4_services/storeControllerTools.js";

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
 * @param miroirDataStoreProxy
 * @param appDataStoreProxy
 * @param body
 * @returns
 */
export async function modelActionStoreRunner(
  miroirDataStoreProxy: StoreControllerInterface,
  appDataStoreProxy: StoreControllerInterface,
  deploymentUuid: string,
  actionName: string,
  body: any
): Promise<void> {
  log.info(
    "###################################### modelActionStoreRunner started deploymentUuid",
    deploymentUuid,
    "actionName",
    actionName
  );
  log.debug("modelActionStoreRunner getEntityUuids()", miroirDataStoreProxy.getEntityUuids());
  const targetProxy: StoreControllerInterface =
    deploymentUuid == applicationDeploymentMiroir.uuid ? miroirDataStoreProxy : appDataStoreProxy;
  const modelAction: ModelAction = body;
  // log.info('modelActionStoreRunner action', JSON.stringify(update,undefined,2));
  log.info("modelActionStoreRunner action", modelAction);
  switch (modelAction.actionName) {
    case "alterEntityAttribute":
    case "createEntity":
    case "renameEntity": 
    case "resetData":
    case "dropEntity": {
      await targetProxy.handleAction(modelAction)
      break;
    }
    case "resetModel": {
      log.debug("modelActionStoreRunner resetModel update");
      await miroirDataStoreProxy.handleAction(modelAction)
      await appDataStoreProxy.handleAction(modelAction)
      log.trace("modelActionStoreRunner resetModel after dropped entities:", miroirDataStoreProxy.getEntityUuids());
      break;
    }
    case "initModel": {
      const modelActionInitModel = body as ModelActionInitModel;
      const params: ModelActionInitModelParams = modelActionInitModel.params;
      log.debug("modelActionStoreRunner initModel params", params);

      if (params.dataStoreType == "miroir") {
        await miroirDataStoreProxy.handleAction(modelActionInitModel)
      } else {
        await appDataStoreProxy.handleAction(modelActionInitModel)
      }
      break;
    }
    case "commit":
    case "rollback": {
      throw new Error("modelActionStoreRunner could not handle action" + JSON.stringify(modelAction));
    }
    default:
      log.warn("modelActionStoreRunner could not handle actionName", actionName);
      break;
  }
  log.debug("modelActionStoreRunner returning empty response.");
  return Promise.resolve(undefined);
}

// ################################################################################################
/**
 * runs a model action: "modelActionUpdateEntity" ("create", "update" or "delete" an Entity), "resetModel" to start again from scratch, etc.
 * @param actionName
 * @param action
 * @returns
 */
export async function restStoreActionOrBundleActionRunnerImplementation(
  actionName: string,
  action: StoreOrBundleAction,
  storeControllerManager: StoreControllerManagerInterface
  // miroirConfig:MiroirConfigClient,
): Promise<void> {
  log.info("###################################### restStoreActionOrBundleActionRunnerImplementation started ", "actionName", actionName);
  // log.debug('restStoreActionOrBundleActionRunnerImplementation getEntityUuids()', miroirDataStoreProxy.getEntityUuids());
  // const update: StoreManagementAction = action;

  log.info("restStoreActionOrBundleActionRunnerImplementation action", JSON.stringify(action, undefined, 2));
  switch (action.actionName) {
    // case "createBundle":
    // case "deleteBundle":
    //   break;
    case "createStore": {
      log.warn("restStoreActionOrBundleActionRunnerImplementation createStore does nothing!")
      break;
    }
    case "deleteStore": {
      log.warn("restStoreActionOrBundleActionRunnerImplementation deleteStore does nothing!")
      break;
    }
    case "openStore": {
      // log.info('restStoreActionOrBundleActionRunnerImplementation openStore',miroirConfig);

      // TODO: NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      // TODO: addStoreController takes deploymentUuid, not ApplicationSection as 1st parameter!
      await storeControllerManager.deleteStoreController(applicationDeploymentMiroir.uuid);
      await storeControllerManager.deleteStoreController(applicationDeploymentLibrary.uuid);
      await storeControllerManager.addStoreController(
        applicationDeploymentMiroir.uuid,
        action.configuration[applicationDeploymentMiroir.uuid]
      );
      await storeControllerManager.addStoreController(
        applicationDeploymentLibrary.uuid,
        action.configuration[applicationDeploymentLibrary.uuid]
      );
      // }
      const localMiroirStoreController = storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
      const localAppStoreController = storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);
      if (!localMiroirStoreController || !localAppStoreController) {
        throw new Error("could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
      }

      await startLocalStoreControllers(localMiroirStoreController, localAppStoreController);

      log.info("restStoreActionOrBundleActionRunnerImplementation openStore DONE!", storeControllerManager.getStoreControllers());

      break;
    }
    case "closeStore": {
      log.info("restStoreActionOrBundleActionRunnerImplementation closeStore");
      // NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      await storeControllerManager.deleteStoreController(applicationDeploymentLibrary.uuid);
      await storeControllerManager.deleteStoreController(applicationDeploymentMiroir.uuid);

      log.info("restStoreActionOrBundleActionRunnerImplementation closeStore DONE!", storeControllerManager.getStoreControllers());

      break;
    }
    default:
      log.warn("restStoreActionOrBundleActionRunnerImplementation could not handle actionName", actionName);
      break;
  }
  log.debug("restStoreActionOrBundleActionRunnerImplementation returning empty response.");
  return Promise.resolve(undefined);
}
