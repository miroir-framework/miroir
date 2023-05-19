import { defaultMiroirMetaModel } from "../1_core/Model.js";
import { ModelReplayableUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { StoreControllerInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import entityEntity from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { DomainModelInitAction, DomainModelInitActionParams } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import applicationDeploymentMiroir from "../assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";


export async function initApplicationDeployment(
  deploymentUuid: string,
  actionName:string,
  miroirDataStoreProxy:StoreControllerInterface,
  appDataStoreProxy:StoreControllerInterface,
  params:DomainModelInitActionParams
) {
  console.log("ModelUpdateRunner model/initModel params",params);
  if (params.dataStoreType == 'miroir') { // TODO: improve, test is dirty
    await miroirDataStoreProxy.initApplication(
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
    await appDataStoreProxy.initApplication(
      params.metaModel,
      'app',
      params.application,
      params.applicationDeployment,
      params.applicationModelBranch,
      params.applicationVersion,
      params.applicationStoreBasedConfiguration,
    );
  }
  console.log('server post resetModel after initModel, entities:',miroirDataStoreProxy.getEntities());
}
export async function modelActionRunner(
  deploymentUuid: string,
  actionName:string,
  miroirDataStoreProxy:StoreControllerInterface,
  appDataStoreProxy:StoreControllerInterface,
  body:any
):Promise<void> {
  // console.log("server post model/"," started #####################################");
  // console.log("server post model/"," started #####################################");

  // const localData = await localIndexedDbDataStore.upsertDataInstance(parentName, addedObjects[0]);
  // for (const instance of addedObjects) {
  console.log('###################################### ModelUpdateRunner started deploymentUuid', deploymentUuid,'actionName',actionName);
  console.log('ModelUpdateRunner getEntities()', miroirDataStoreProxy.getEntities());
  switch (actionName) {
    case 'resetModel':{
      // const update = (await req.body)[0];
      console.log("ModelUpdateRunner resetModel update");
      await miroirDataStoreProxy.dropModelAndData(defaultMiroirMetaModel);
      await appDataStoreProxy.dropModelAndData(defaultMiroirMetaModel);
      console.log('ModelUpdateRunner resetModel after dropped entities:',miroirDataStoreProxy.getEntities());
      break;
    }
    case 'initModel':{
      // const update:DomainModelInitAction = JSON.parse(body[0]);
      const params:DomainModelInitActionParams = body as DomainModelInitActionParams;
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
      const update: ModelReplayableUpdate = body[0];
      console.log("ModelUpdateRunner updateEntity update",update);
      if (update) {
        switch (update['action']) {
          default: {
            const targetProxy = deploymentUuid == applicationDeploymentMiroir.uuid?miroirDataStoreProxy:appDataStoreProxy;
            console.log('ModelUpdateRunner updateEntity update',update['action'],'used targetProxy',targetProxy['applicationName'],deploymentUuid,applicationDeploymentMiroir.uuid);
            
            await targetProxy.applyModelEntityUpdate(update);
            console.log('ModelUpdateRunner applyModelEntityUpdate done', update);
            break;
          }
        }
      } else {
        console.log('ModelUpdateRunner has no update to execute!')
      }
      break;
    }
    default:
      console.log('ModelUpdateRunner could not handle actionName', actionName)
      break;
  }
  return Promise.resolve(undefined);
}

  // ##############################################################################################
  export async function applyModelEntityUpdate(
    appDataStoreProxy:StoreControllerInterface,
    update:ModelReplayableUpdate
  ){
    console.log('ModelActionRunner applyModelEntityUpdate',update);
    const modelCUDupdate = update.updateActionName == 'WrappedModelEntityUpdateWithCUDUpdate'? update.equivalentModelCUDUpdates[0]:update;
    if (
      [entityEntity.uuid, entityEntityDefinition.uuid].includes(modelCUDupdate.objects[0].parentUuid) ||
      appDataStoreProxy.existsEntity(modelCUDupdate.objects[0].parentUuid)
    ) {
      // console.log('IndexedDbDataStore applyModelEntityUpdate',modelEntityUpdate);
      if (update.updateActionName == "WrappedModelEntityUpdateWithCUDUpdate") {
        const modelEntityUpdate = update.modelEntityUpdate;
        switch (update.modelEntityUpdate.updateActionName) {
          case "DeleteEntity":{
            await appDataStoreProxy.dropEntity(update.modelEntityUpdate.entityUuid)
            break;
          }
          case "alterEntityAttribute": { 
            break;
          }
          case "renameEntity":{
            await appDataStoreProxy.renameEntity(update);
            break;
          }
          // case "renameEntity": {
          //   break;
          // }
          case "createEntity": {
            for (const entity of update.modelEntityUpdate.entities) {
              console.log('ModelActionRunner applyModelEntityUpdates createEntity inserting',entity);
              await appDataStoreProxy.createEntity(entity.entity, entity.entityDefinition);
            }
            break;
          }
          default:
            break;
        }
      } else {
        // same implementation as in sqlDbServer
        switch (update.updateActionName) {
          case "create": 
          case "update":{
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await appDataStoreProxy.upsertDataInstance(instance.parentUuid, instance);
              }
            }
            break;
          }
          case "delete":{
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await appDataStoreProxy.deleteDataInstance(instanceCollection.parentUuid, instance)
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
