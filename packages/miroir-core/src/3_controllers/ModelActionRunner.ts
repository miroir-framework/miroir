import { DomainModelInitActionParams } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { ModelReplayableUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { IStoreController } from "../0_interfaces/4-services/remoteStore/IStoreController.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import applicationDeploymentMiroir from "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"ModelActionRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export async function initApplicationDeployment(
  deploymentUuid: string,
  actionName:string,
  miroirStoreController:IStoreController,
  appStoreController:IStoreController,
  params:DomainModelInitActionParams
) {
  log.info("modelActionRunner model/initModel params",params);
  if (params.dataStoreType == 'miroir') { // TODO: improve, test is dirty
    await miroirStoreController.initApplication(
      // defaultMiroirMetaModel,
      params.metaModel,
      params.dataStoreType,
      params.application,
      params.applicationDeployment,
      params.applicationModelBranch,
      params.applicationVersion,
      params.applicationStoreBasedConfiguration,
    );
  } else { // different Proxy object!!!!!!
    await appStoreController.initApplication(
      params.metaModel,
      'app',
      params.application,
      params.applicationDeployment,
      params.applicationModelBranch,
      params.applicationVersion,
      params.applicationStoreBasedConfiguration,
    );
  }
  log.debug('server post resetModel after initModel, entities:',miroirStoreController.getEntityUuids());
}

// ##############################################################################################
export async function applyModelEntityUpdate(
  storeController:IStoreController,
  update:ModelReplayableUpdate
):Promise<void>{
  // log.info('ModelActionRunner applyModelEntityUpdate for',update);
  log.info('ModelActionRunner applyModelEntityUpdate for',JSON.stringify(update, null, 2));
  const modelCUDupdate = update.updateActionName == 'WrappedTransactionalEntityUpdateWithCUDUpdate'? update.equivalentModelCUDUpdates[0]:update;
  if (
    [entityEntity.uuid, entityEntityDefinition.uuid].includes(modelCUDupdate.objects[0].parentUuid) ||
    storeController.existsEntity(modelCUDupdate.objects[0].parentUuid)
  ) {
    // log.info('StoreController applyModelEntityUpdate',modelEntityUpdate);
    if (update.updateActionName == "WrappedTransactionalEntityUpdateWithCUDUpdate") {
      // const modelEntityUpdate = update.modelEntityUpdate;
      switch (update.modelEntityUpdate.updateActionName) {
        case "DeleteEntity":{
          await storeController.dropEntity(update.modelEntityUpdate.entityUuid)
          break;
        }
        case "alterEntityAttribute": { 
          break;
        }
        case "renameEntity":{
          await storeController.renameEntity(update);
          break;
        }
        // case "renameEntity": {
        //   break;
        // }
        case "createEntity": {
          for (const entity of update.modelEntityUpdate.entities) {
            log.debug('ModelActionRunner applyModelEntityUpdates createEntity inserting',entity);
            await storeController.createEntity(entity.entity, entity.entityDefinition);
          }
          break;
        }
        default:
          break;
      }
    } else {
      switch (update.updateActionName) {
        case "create": 
        case "update":{
          for (const instanceCollection of update.objects) {
            for (const instance of instanceCollection.instances) {
              await storeController.upsertInstance('data', instance);
            }
          }
          break;
        }
        case "delete":{
          for (const instanceCollection of update.objects) {
            for (const instance of instanceCollection.instances) {
              await storeController.deleteInstance('data', instance)
            }
          }
          break;
        }
        default:
          break;
      }
    }
  } else {
    console.warn(
      "applyModelEntityUpdate entity uuid",
      modelCUDupdate.objects[0].parentUuid,
      "name",
      modelCUDupdate.objects[0].parentName,
      "not found!"
    );
  }
  return Promise.resolve(undefined);
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
  miroirDataStoreProxy:IStoreController,
  appDataStoreProxy:IStoreController,
  deploymentUuid: string,
  actionName:string,
  body:any
):Promise<void> {
  // log.info("server post model/"," started #####################################");
  // log.info("server post model/"," started #####################################");

  // const localData = await localIndexedDbDataStore.upsertDataInstance(parentName, addedObjects[0]);
  // for (const instance of addedObjects) {
  log.info('###################################### modelActionRunner started deploymentUuid', deploymentUuid,'actionName',actionName);
  log.debug('modelActionRunner getEntityUuids()', miroirDataStoreProxy.getEntityUuids());
  switch (actionName) {
    case 'resetModel':{
      log.debug("modelActionRunner resetModel update");
      await miroirDataStoreProxy.clear();
      await appDataStoreProxy.clear();
      log.trace('modelActionRunner resetModel after dropped entities:',miroirDataStoreProxy.getEntityUuids());
      break;
    }
    case 'resetData':{
      log.debug("modelActionRunner resetData update");
      await appDataStoreProxy.clearDataInstances();
      log.trace('modelActionRunner resetData after cleared data contents for entities:',miroirDataStoreProxy.getEntityUuids());
      break;
    }
    case 'initModel':{
      const params:DomainModelInitActionParams = body as DomainModelInitActionParams;
      log.debug('modelActionRunner initModel params',params);

      await initApplicationDeployment(
        deploymentUuid,
        actionName,
        miroirDataStoreProxy,
        appDataStoreProxy,
        params
      );
      break;
    }
    case 'updateEntity': {
      const update: ModelReplayableUpdate = body;
      log.debug("modelActionRunner updateEntity update",update);
      if (update) {
        // switch ((update as any)['action']) {
        //   default: {
        const targetProxy = deploymentUuid == applicationDeploymentMiroir.uuid?miroirDataStoreProxy:appDataStoreProxy;
        log.trace(
          "modelActionRunner updateEntity",
          "used targetProxy",
          (targetProxy as any)["applicationName"],
          deploymentUuid,
          applicationDeploymentMiroir.uuid
        );
        
        await targetProxy.applyModelEntityUpdate(update);
        log.trace('modelActionRunner applyModelEntityUpdate done', update);
            // break;
          // }
        // }
      } else {
        log.warn('modelActionRunner has no update to execute!')
      }
      break;
    }
    default:
      log.warn('modelActionRunner could not handle actionName', actionName)
      break;
  }
  log.debug('modelActionRunner returning empty response.')
  return Promise.resolve(undefined);
}

