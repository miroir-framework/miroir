import {
  MiroirAction,
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
export async function initApplicationDeployment(
  deploymentUuid: string,
  actionName: string,
  miroirStoreController: StoreControllerInterface,
  appStoreController: StoreControllerInterface,
  params: ModelActionInitModelParams
) {
  log.info("ActionRunner.ts initApplicationDeployment model/initModel params", params);
  if (params.dataStoreType == "miroir") {
    // TODO: improve, test is dirty
    await miroirStoreController.initApplication(
      // defaultMiroirMetaModel,
      params.metaModel,
      params.dataStoreType,
      params.application,
      params.applicationDeploymentConfiguration,
      params.applicationModelBranch,
      params.applicationVersion,
      params.applicationStoreBasedConfiguration
    );
    log.info(
      "ActionRunner.ts initApplicationDeployment miroir model/initModel contents",
      await miroirStoreController.getState()
    );
  } else {
    // different Proxy object!!!!!!
    await appStoreController.initApplication(
      params.metaModel,
      "app",
      params.application,
      params.applicationDeploymentConfiguration,
      params.applicationModelBranch,
      params.applicationVersion,
      params.applicationStoreBasedConfiguration
    );
    log.info(
      "ActionRunner.ts initApplicationDeployment app model/initModel contents",
      await appStoreController.getState()
    );
  }
  log.debug("server post resetModel after initModel, entities:", miroirStoreController.getEntityUuids());
}

// ################################################################################################
/**
 * runs a model action: "updateEntity" ("create", "update" or "delete" an Entity), "resetModel" to start again from scratch, etc.
 * @param deploymentUuid
 * @param actionName
 * @param miroirDataStoreProxy
 * @param appDataStoreProxy
 * @param body
 * @returns
 */
export async function modelActionRunner(
  miroirDataStoreProxy: StoreControllerInterface,
  appDataStoreProxy: StoreControllerInterface,
  deploymentUuid: string,
  actionName: string,
  body: any
): Promise<void> {
  log.info(
    "###################################### modelActionRunner started deploymentUuid",
    deploymentUuid,
    "actionName",
    actionName
  );
  log.debug("modelActionRunner getEntityUuids()", miroirDataStoreProxy.getEntityUuids());
  const targetProxy: StoreControllerInterface =
    deploymentUuid == applicationDeploymentMiroir.uuid ? miroirDataStoreProxy : appDataStoreProxy;
  const update: ModelAction = body;
  // log.info('modelActionRunner action', JSON.stringify(update,undefined,2));
  log.info("modelActionRunner action", update);
  switch (update.actionName) {
    case "dropEntity": {
      // await targetProxy.dropEntity(update.modelEntityUpdate.entityUuid);
      await targetProxy.dropEntity(update.entityUuid);
      break;
    }
    case "renameEntity": {
      await targetProxy.renameEntityClean(update);
      break;
    }
    case "resetModel": {
      log.debug("modelActionRunner resetModel update");
      await miroirDataStoreProxy.clear();
      await appDataStoreProxy.clear();
      log.trace("modelActionRunner resetModel after dropped entities:", miroirDataStoreProxy.getEntityUuids());
      break;
    }
    case "alterEntityAttribute": {
      await targetProxy.alterEntityAttribute(update);
      break;
    }
    case "resetData": {
      log.debug("modelActionRunner resetData update");
      await appDataStoreProxy.clearDataInstances();
      log.trace(
        "modelActionRunner resetData after cleared data contents for entities:",
        miroirDataStoreProxy.getEntityUuids()
      );
      break;
    }
    case "initModel": {
      const modelActionInitModel = body as ModelActionInitModel;
      const params: ModelActionInitModelParams = modelActionInitModel.params;
      log.debug("modelActionRunner initModel params", params);

      await initApplicationDeployment(deploymentUuid, actionName, miroirDataStoreProxy, appDataStoreProxy, params);
      break;
    }
    // case "alterEntityAttribute":
    case "commit":
    case "rollback": {
      throw new Error("modelActionRunner could not handle action" + JSON.stringify(update));
    }
    case "createEntity": {
      log.debug("modelActionRunner applyModelEntityUpdates createEntity inserting", update.entities);
      // await targetProxy.createEntity(update.entity, update.entityDefinition);
      await targetProxy.createEntities(update.entities);
      break;
    }
    default:
      log.warn("modelActionRunner could not handle actionName", actionName);
      break;
  }
  log.debug("modelActionRunner returning empty response.");
  return Promise.resolve(undefined);
}

// ################################################################################################
/**
 * runs a model action: "updateEntity" ("create", "update" or "delete" an Entity), "resetModel" to start again from scratch, etc.
 * @param actionName
 * @param action
 * @returns
 */
export async function actionRunner(
  actionName: string,
  action: MiroirAction,
  storeControllerManager: StoreControllerManagerInterface
  // miroirConfig:MiroirConfigClient,
): Promise<void> {
  log.info("###################################### actionRunner started ", "actionName", actionName);
  // log.debug('actionRunner getEntityUuids()', miroirDataStoreProxy.getEntityUuids());
  // const update: StoreAction = action;

  log.info("actionRunner action", JSON.stringify(action, undefined, 2));
  switch (action.actionName) {
    // case "createBundle":
    // case "deleteBundle":
    //   break;
    case "createStore": {
      log.warn("actionRunner createStore does nothing!")
      break;
    }
    case "deleteStore": {
      log.warn("actionRunner deleteStore does nothing!")
      break;
    }
    case "openStore": {
      // log.info('actionRunner openStore',miroirConfig);

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

      log.info("actionRunner openStore DONE!", storeControllerManager.getStoreControllers());

      break;
    }
    case "closeStore": {
      log.info("actionRunner closeStore");
      // NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      await storeControllerManager.deleteStoreController(applicationDeploymentLibrary.uuid);
      await storeControllerManager.deleteStoreController(applicationDeploymentMiroir.uuid);

      log.info("actionRunner closeStore DONE!", storeControllerManager.getStoreControllers());

      break;
    }
    default:
      log.warn("actionRunner could not handle actionName", actionName);
      break;
  }
  log.debug("actionRunner returning empty response.");
  return Promise.resolve(undefined);
}
