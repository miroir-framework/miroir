
import { IndexedDb } from "./indexedDb";
import { Instance } from "../0_interfaces/1_core/Instance";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";

export class IndexedDbServer implements DataStoreInterface{
  constructor(
    private localIndexedDb: IndexedDb,
  ){}
  
  getInstances(entityName:string):Promise<any> {
    return this.localIndexedDb.getAllValue(entityName);
  }
  
  upsertInstance(entityName:string, instance:Instance):Promise<any> {
  
    if (entityName == "Entity") {
      this.localIndexedDb.addSubLevels([entityName]);
    }
  
    return this.localIndexedDb.putValue(entityName,instance);
  }
  
  async deleteInstances(entityName:string, instances:Instance[]):Promise<any> {
    for (const o of instances) {
      await this.localIndexedDb.deleteValue(entityName, o["uuid"]);
    }
    return Promise.resolve();
  }
}

// export async function indexedDbGetInstances(localIndexedDb: IndexedDb, entityName:string):Promise<any> {
//   return localIndexedDb.getAllValue(entityName);
// }

// export async function indexedDbUpsertInstance(localIndexedDb: IndexedDb, entityName:string, instance:Instance):Promise<any> {

//   if (entityName == "Entity") {
//     localIndexedDb.addSubLevels([entityName]);
//   }

//   return localIndexedDb.putValue(entityName,instance);
// }

// export async function indexedDbdeleteInstances(localIndexedDb: IndexedDb, entityName:string, instances:Instance[]):Promise<any> {
//   for (const o of instances) {
//     await localIndexedDb.deleteValue(entityName, o["uuid"]);
//   }
//   return Promise.resolve();
// }