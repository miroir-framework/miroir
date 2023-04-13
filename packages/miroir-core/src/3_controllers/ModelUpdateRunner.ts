import { ModelReplayableUpdate } from "src/0_interfaces/2_domain/ModelUpdateInterface";
import { DataStoreInterface } from "src/0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";

export async function ModelUpdateRunner(
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