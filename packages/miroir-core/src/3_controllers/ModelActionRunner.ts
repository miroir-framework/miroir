import { DomainModelInitActionParams } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { ModelReplayableUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { IStoreController } from "../0_interfaces/4-services/remoteStore/IStoreController.js";
import applicationDeploymentMiroir from "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';

// ################################################################################################
export async function initApplicationDeployment(
  deploymentUuid: string,
  actionName:string,
  miroirStoreController:IStoreController,
  appStoreController:IStoreController,
  params:DomainModelInitActionParams
) {
  console.log("modelActionRunner model/initModel params",params);
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
  console.log('server post resetModel after initModel, entities:',miroirStoreController.getEntityUuids());
}

// ##############################################################################################
export async function applyModelEntityUpdate(
  storeController:IStoreController,
  update:ModelReplayableUpdate
):Promise<void>{
  console.log('ModelActionRunner applyModelEntityUpdate for',JSON.stringify(update, null, 2));
  const modelCUDupdate = update.updateActionName == 'WrappedTransactionalEntityUpdateWithCUDUpdate'? update.equivalentModelCUDUpdates[0]:update;
  if (
    [entityEntity.uuid, entityEntityDefinition.uuid].includes(modelCUDupdate.objects[0].parentUuid) ||
    storeController.existsEntity(modelCUDupdate.objects[0].parentUuid)
  ) {
    // console.log('StoreController applyModelEntityUpdate',modelEntityUpdate);
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
            console.log('ModelActionRunner applyModelEntityUpdates createEntity inserting',entity);
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
  deploymentUuid: string,
  actionName:string,
  miroirDataStoreProxy:IStoreController,
  appDataStoreProxy:IStoreController,
  body:any
):Promise<void> {
  // console.log("server post model/"," started #####################################");
  // console.log("server post model/"," started #####################################");

  // const localData = await localIndexedDbDataStore.upsertDataInstance(parentName, addedObjects[0]);
  // for (const instance of addedObjects) {
  console.log('###################################### modelActionRunner started deploymentUuid', deploymentUuid,'actionName',actionName);
  console.log('modelActionRunner getEntityUuids()', miroirDataStoreProxy.getEntityUuids());
  switch (actionName) {
    case 'resetModel':{
      console.log("modelActionRunner resetModel update");
      await miroirDataStoreProxy.clear();
      await appDataStoreProxy.clear();
      console.log('modelActionRunner resetModel after dropped entities:',miroirDataStoreProxy.getEntityUuids());
      break;
    }
    case 'resetData':{
      console.log("modelActionRunner resetData update");
      await appDataStoreProxy.clearDataInstances();
      console.log('modelActionRunner resetData after cleared data contents for entities:',miroirDataStoreProxy.getEntityUuids());
      break;
    }
    case 'initModel':{
      const params:DomainModelInitActionParams = body as DomainModelInitActionParams;
      console.log('modelActionRunner initModel params',params);

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
      console.log("modelActionRunner updateEntity update",update);
      if (update) {
        // switch ((update as any)['action']) {
        //   default: {
        const targetProxy = deploymentUuid == applicationDeploymentMiroir.uuid?miroirDataStoreProxy:appDataStoreProxy;
        console.log(
          "modelActionRunner updateEntity",
          "used targetProxy",
          (targetProxy as any)["applicationName"],
          deploymentUuid,
          applicationDeploymentMiroir.uuid
        );
        
        await targetProxy.applyModelEntityUpdate(update);
        console.log('modelActionRunner applyModelEntityUpdate done', update);
            // break;
          // }
        // }
      } else {
        console.log('modelActionRunner has no update to execute!')
      }
      break;
    }
    default:
      console.log('modelActionRunner could not handle actionName', actionName)
      break;
  }
  console.log('modelActionRunner returning empty response.')
  return Promise.resolve(undefined);
}

