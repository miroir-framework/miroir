import { ModelReplayableUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";

export async function modelActionRunner(
  actionName:string,
  localDataStore:DataStoreInterface,
  body:any[]
):Promise<void> {
  console.log("server post model/"," started #####################################");

  // const localData = await localIndexedDbDataStore.upsertInstance(parentName, addedObjects[0]);
  // for (const instance of addedObjects) {
  console.log('ModelUpdateRunner getEntityDefinitions()', localDataStore.getEntityDefinitions());
  switch (actionName) {
    case 'resetModel':{
      // const update = (await req.body)[0];
      console.log("ModelUpdateRunner resetModel update");
      await localDataStore.dropModel();
      console.log('ModelUpdateRunner resetModel after dropped entities:',localDataStore.getEntities(),'entityDefinitions:',localDataStore.getEntityDefinitions());
      break;
    }
    case 'initModel':{
      const update = body[0];
      console.log("ModelUpdateRunner model/initModel update",update);
      await localDataStore.initModel();
      console.log('server post resetModel after initModel, entities:',localDataStore.getEntities(),'entityDefinitions:',localDataStore.getEntityDefinitions());
      break;
    }
    case 'updateEntity': {
      const update: ModelReplayableUpdate = body[0];
      console.log("ModelUpdateRunner updateEntity update",update);
      if (update) {
        switch (update['action']) {
          default:
            await localDataStore.applyModelEntityUpdate(update);
            console.log('ModelUpdateRunner applyModelEntityUpdate done', update);
            break;
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
    dataStore:DataStoreInterface,
    update:ModelReplayableUpdate
  ){
    console.log('ModelActionRunner applyModelEntityUpdate',update);
    const modelCUDupdate = update.updateActionName == 'WrappedModelEntityUpdateWithCUDUpdate'? update.equivalentModelCUDUpdates[0]:update;
    if (dataStore.existsEntity(modelCUDupdate.objects[0].parentUuid)) {
      // console.log('IndexedDbDataStore applyModelEntityUpdate',modelEntityUpdate);
      if (update.updateActionName == "WrappedModelEntityUpdateWithCUDUpdate") {
        const modelEntityUpdate = update.modelEntityUpdate;
        switch (update.modelEntityUpdate.updateActionName) {
          case "DeleteEntity":{
            await dataStore.dropEntity(update.modelEntityUpdate.entityUuid)
            break;
          }
          case "alterEntityAttribute": { 
            break;
          }
          case "renameEntity":{
            await dataStore.renameEntity(update);
            break;
          }
          // case "renameEntity": {
          //   break;
          // }
          case "createEntity": {
            for (const entity of update.modelEntityUpdate.entities) {
              console.log('ModelActionRunner applyModelEntityUpdates createEntity inserting',entity);
              await dataStore.createEntity(entity.entity, entity.entityDefinition);

              // await dataStore.upsertInstance(entityEntity.uuid, instance.entity);
              // await dataStore.upsertInstance(entityEntityDefinition.uuid, instance.entityDefinition);
              // await dataStore.localUuidIndexedDb.putValue(entityEntity.uuid, instance.entity);
              // await dataStore.localUuidIndexedDb.putValue(entityEntityDefinition.uuid, instance.entityDefinition);
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
                await dataStore.upsertInstance(instance.parentUuid, instance);
              }
            }
            break;
          }
          case "delete":{
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await dataStore.deleteInstance(instanceCollection.parentUuid, instance)
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
        "ModelActionRunner entity uuid",
        modelCUDupdate.objects[0].parentUuid,
        "name",
        modelCUDupdate.objects[0].parentName,
        "not found!"
      );
    }
  }
