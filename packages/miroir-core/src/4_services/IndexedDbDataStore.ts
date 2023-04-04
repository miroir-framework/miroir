
import { Instance } from "../0_interfaces/1_core/Instance";
import { ModelEntityUpdateDeleteMetaModelInstance, ModelEntityUpdateWithCUDUpdate, ModelUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { IndexedDb } from "./indexedDb";

export class IndexedDbDataStore implements DataStoreInterface{
  constructor(
    private localUuidIndexedDb: IndexedDb,
  ){}

  public getdb():any{
    return this.localUuidIndexedDb.db;
  }

  // #############################################################################################
  async dropModel(){
    return this.clear();
  }

  // #############################################################################################
  async init():Promise<void> {
    await this.localUuidIndexedDb.createObjectStore([]);
    return Promise.resolve();
  }

  // #############################################################################################
  addConcepts(conceptsNames:string[]) {
    this.localUuidIndexedDb.addSubLevels(conceptsNames)
  }

  // #############################################################################################
  open():Promise<void> {
    return this.localUuidIndexedDb.openObjectStore();
  }
  
  // ##############################################################################################
  close():Promise<void> {
    return this.localUuidIndexedDb.closeObjectStore();
  }

  // ##############################################################################################
  clear():Promise<void> {
    return this.localUuidIndexedDb.clearObjectStore();
    // this.dropUuidEntities(this.getUuidEntities());
  }

  // #############################################################################################
  getUuidEntities(): string[] {
      return this.localUuidIndexedDb.getSubLevels();
  }

  // #############################################################################################
  dropUuidEntity(entityUuid:string) {
    if (this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
      this.localUuidIndexedDb.removeSubLevels([entityUuid]);
    } else {
      console.warn('dropUuidEntity entityName not found:', entityUuid);
    } 
  }

  // #############################################################################################
  dropUuidEntities(entityUuids:string[]) {
    entityUuids.forEach(e =>this.dropUuidEntity(e));
  }
  
  // #############################################################################################
  getInstancesUuid(entityUuid:string):Promise<any> {
    return this.localUuidIndexedDb.getAllValue(entityUuid);
  }
  
  // #############################################################################################
  upsertInstanceUuid(entityUuid:string, instance:Instance):Promise<any> {
    console.log('IndexedDbDataStore upsertInstanceUuid',instance.entityUuid, instance);

    // if (instance.entityUuid == entityEntity.uuid && !this.localUuidIndexedDb.hasSubLevel(instance.entityUuid)) {
    if (!this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
      console.log('IndexedDbDataStore upsertInstanceUuid create sublevel',entityUuid);
      this.localUuidIndexedDb.addSubLevels([entityUuid]);
    } else {
      console.log('IndexedDbDataStore upsertInstanceUuid existing sublevel',entityUuid,this.localUuidIndexedDb.hasSubLevel(entityUuid));
    }

    return this.localUuidIndexedDb.putValue(entityUuid,instance);
  }

  // #############################################################################################
  async deleteInstancesUuid(entityUuid:string, instances:Instance[]):Promise<any> {
    console.log('IndexedDbDataStore deleteInstancesUuid',entityUuid, instances);
    for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(entityUuid, o.uuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteInstanceUuid(entityUuid:string, instance:Instance):Promise<any> {
    console.log('IndexedDbDataStore deleteInstanceUuid',entityUuid, instance);
    // for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(entityUuid, instance.uuid);
    // }
    return Promise.resolve();
  }

  // ##############################################################################################
  // async applyModelEntityUpdates(updates:ModelEntityUpdate[]){
  async applyModelEntityUpdate(update:ModelUpdate){
    console.log('IndexedDbDataStore applyModelEntityUpdate',update);
    const modelCUDupdate = update.updateActionName == 'ModelEntityUpdateWithCUDUpdate'? update.equivalentModelCUDUpdates[0]:update;
    // if (this.sqlUuidEntities && this.sqlUuidEntities[modelCUDupdate.objects[0].entityUuid]) {
    if (this.localUuidIndexedDb.hasSubLevel(modelCUDupdate.objects[0].entityUuid)) {
      // console.log('IndexedDbDataStore applyModelEntityUpdate',modelEntityUpdate);
      if (update.updateActionName == "ModelEntityUpdateWithCUDUpdate") {
        const modelEntityUpdate = update.modelEntityUpdate;
        switch (update.modelEntityUpdate.updateActionName) {
          case "DeleteMetaModelInstance":{
            const deleteStructureUpdate = modelEntityUpdate as ModelEntityUpdateDeleteMetaModelInstance;
            await this.deleteInstanceUuid(deleteStructureUpdate.entityUuid,{uuid:deleteStructureUpdate.instanceUuid} as Instance)
            break;
          }
          case "alterMetaModelInstance":
          case "alterEntityAttribute":
          case "renameEntity": {
            const cudUpdate = update.equivalentModelCUDUpdates[0];
            const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].entityUuid,cudUpdate.objects[0].instances[0].uuid);
            console.log('IndexedDbDataStore applyModelEntityUpdates',cudUpdate.objects[0].instances[0].entityUuid,currentValue);
            // update the instance in table Entity corresponding to the renamed entity
            await this.localUuidIndexedDb.putValue(
              cudUpdate.objects[0].instances[0].entityUuid,
              cudUpdate.objects[0].instances[0],
            );
            const updatedValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].entityUuid,cudUpdate.objects[0].instances[0].uuid);
            console.log('IndexedDbDataStore applyModelEntityUpdates done',cudUpdate.objects[0].instances[0].entityUuid,updatedValue);
            break;
          }
          case "create": {
            for (const instance of update.modelEntityUpdate.instances) {
              // await this.upsertInstanceUuid(modelEntityUpdate.entityUuid, instance);
              console.log('IndexedDbDataStore applyModelEntityUpdates create inserting instance',instance);
              
              await this.localUuidIndexedDb.putValue(modelEntityUpdate.entityUuid, instance);
            }
            break;
          }
          default:
            break;
        }
      } else {
        // same implementation as in sqlDbServer
        switch (update.updateActionName) {
          case "create": {
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await this.upsertInstanceUuid(instance.entityUuid, instance);
              }
            }
            break;
          }
          case "update":{
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await this.upsertInstanceUuid(instance.entityUuid, instance);
              }
            }
            break;
          }
          case "delete":{
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await this.deleteInstanceUuid(instanceCollection.entityUuid, instance)
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
        "IndexedDbDataStore SqlDbServer entity uuid",
        modelCUDupdate.objects[0].entityUuid,
        "name",
        modelCUDupdate.objects[0].entity,
        "not found!"
      );
    }
  }
}