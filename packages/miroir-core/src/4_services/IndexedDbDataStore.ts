
import { ModelStructureUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { Instance } from "../0_interfaces/1_core/Instance";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { IndexedDb } from "./indexedDb";
import entityEntity from "../assets/entities/Entity.json";

export class IndexedDbDataStore implements DataStoreInterface{
  constructor(
    private localIndexedDb: IndexedDb,
    private localUuidIndexedDb: IndexedDb,
  ){}

  async init():Promise<void> {
    return Promise.resolve();
  }

  getEntities(): string[] {
      return this.localIndexedDb.getSubLevels();
  }

  dropEntity(entityName:string) {
    if (this.localIndexedDb.hasSubLevel(entityName)) {
      this.localIndexedDb.removeSubLevels([entityName]);
    } else {
      console.warn('dropEntity entityName not found:', entityName);
    } 
  }

  dropEntities(entityNames:string[]) {
    entityNames.forEach(e =>this.dropEntity(e));
  }
  
  getInstances(entityName:string):Promise<any> {
    return this.localIndexedDb.getAllValue(entityName);
  }
  
  upsertInstance(entityName:string, instance:Instance):Promise<any> {
    console.log('IndexedDbDataStore upsertInstance',entityName, instance);

    if (entityName == "Entity") {
      this.localIndexedDb.addSubLevels([instance['name']]);
    }

    return this.localIndexedDb.putValue(entityName,instance);
  }

  async deleteInstances(entityName:string, instances:Instance[]):Promise<any> {
    for (const o of instances) {
      await this.localIndexedDb.deleteValue(entityName, o["uuid"]);
    }
    return Promise.resolve();
  }
  async applyModelStructureUpdates(updates:ModelStructureUpdate[]){
    console.log('IndexedDbDataStore applyModelStructureUpdates');
  }

  // ###########################################################################
  getUuidEntities(): string[] {
      return this.localUuidIndexedDb.getSubLevels();
  }

  dropUuidEntity(entityUuid:string) {
    if (this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
      this.localUuidIndexedDb.removeSubLevels([entityUuid]);
    } else {
      console.warn('dropUuidEntity entityName not found:', entityUuid);
    } 
  }

  dropUuidEntities(entityUuids:string[]) {
    entityUuids.forEach(e =>this.dropEntity(e));
  }
  
  getInstancesUuid(entityUuid:string):Promise<any> {
    return this.localUuidIndexedDb.getAllValue(entityUuid);
  }
  
  upsertInstanceUuid(entityUuid:string, instance:Instance):Promise<any> {
    console.log('IndexedDbDataStore upsertUuidInstance',entityUuid, instance);

    if (entityUuid == entityEntity.uuid) {
      this.localUuidIndexedDb.addSubLevels([instance['uuid']]);
    }

    return this.localUuidIndexedDb.putValue(entityUuid,instance);
  }

  async deleteInstancesUuid(entityUuid:string, instances:Instance[]):Promise<any> {
    for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(entityUuid, o["uuid"]);
    }
    return Promise.resolve();
  }

  async applyModelStructureUpdatesUuid(updates:ModelStructureUpdate[]){
    console.log('IndexedDbDataStore applyModelStructureUpdates');
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