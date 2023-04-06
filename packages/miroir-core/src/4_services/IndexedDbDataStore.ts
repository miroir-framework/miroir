
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { ModelEntityUpdateDeleteMetaModelInstance, WrappedModelEntityUpdateWithCUDUpdate, ModelUpdate, ModelReplayableUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
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
  dropUuidEntity(parentUuid:string) {
    if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      this.localUuidIndexedDb.removeSubLevels([parentUuid]);
    } else {
      console.warn('dropUuidEntity parentName not found:', parentUuid);
    } 
  }

  // #############################################################################################
  dropUuidEntities(entityUuids:string[]) {
    entityUuids.forEach(e =>this.dropUuidEntity(e));
  }
  
  // #############################################################################################
  getInstancesUuid(parentUuid:string):Promise<any> {
    return this.localUuidIndexedDb.getAllValue(parentUuid);
  }
  
  // #############################################################################################
  upsertInstanceUuid(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore upsertInstanceUuid',instance.parentUuid, instance);

    // if (instance.parentUuid == entityDefinitionEntityDefinition.uuid && !this.localUuidIndexedDb.hasSubLevel(instance.parentUuid)) {
    if (!this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      console.log('IndexedDbDataStore upsertInstanceUuid create sublevel',parentUuid);
      this.localUuidIndexedDb.addSubLevels([parentUuid]);
    } else {
      console.log('IndexedDbDataStore upsertInstanceUuid existing sublevel',parentUuid,this.localUuidIndexedDb.hasSubLevel(parentUuid));
    }

    return this.localUuidIndexedDb.putValue(parentUuid,instance);
  }

  // #############################################################################################
  async deleteInstancesUuid(parentUuid:string, instances:EntityInstance[]):Promise<any> {
    console.log('IndexedDbDataStore deleteInstancesUuid',parentUuid, instances);
    for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteInstanceUuid(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore deleteInstanceUuid',parentUuid, instance);
    // for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
    // }
    return Promise.resolve();
  }

  // ##############################################################################################
  // async applyModelEntityUpdates(updates:ModelEntityUpdate[]){
  async applyModelEntityUpdate(update:ModelReplayableUpdate){
    console.log('IndexedDbDataStore applyModelEntityUpdate',update);
    const modelCUDupdate = update.updateActionName == 'WrappedModelEntityUpdateWithCUDUpdate'? update.equivalentModelCUDUpdates[0]:update;
    // if (this.sqlUuidEntities && this.sqlUuidEntities[modelCUDupdate.objects[0].parentUuid]) {
    if (this.localUuidIndexedDb.hasSubLevel(modelCUDupdate.objects[0].parentUuid)) {
      // console.log('IndexedDbDataStore applyModelEntityUpdate',modelEntityUpdate);
      if (update.updateActionName == "WrappedModelEntityUpdateWithCUDUpdate") {
        const modelEntityUpdate = update.modelEntityUpdate;
        switch (update.modelEntityUpdate.updateActionName) {
          case "DeleteEntity":{
            const deleteStructureUpdate = modelEntityUpdate as ModelEntityUpdateDeleteMetaModelInstance;
            await this.deleteInstanceUuid(deleteStructureUpdate.parentUuid,{uuid:deleteStructureUpdate.instanceUuid} as EntityInstance)
            break;
          }
          // case "alterMetaModelInstance":
          case "alterEntityAttribute":
          case "renameEntity": {
            const cudUpdate = update.equivalentModelCUDUpdates[0];
            const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
            console.log('IndexedDbDataStore applyModelEntityUpdates',cudUpdate.objects[0].instances[0].parentUuid,currentValue);
            // update the instance in table Entity corresponding to the renamed entity
            await this.localUuidIndexedDb.putValue(
              cudUpdate.objects[0].instances[0].parentUuid,
              cudUpdate.objects[0].instances[0],
            );
            const updatedValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
            console.log('IndexedDbDataStore applyModelEntityUpdates done',cudUpdate.objects[0].instances[0].parentUuid,updatedValue);
            break;
          }
          case "createEntity": {
            for (const instance of update.modelEntityUpdate.instances) {
              // await this.upsertInstanceUuid(modelEntityUpdate.parentUuid, instance);
              console.log('IndexedDbDataStore applyModelEntityUpdates create inserting instance',instance);
              
              await this.localUuidIndexedDb.putValue(modelEntityUpdate.parentUuid, instance);
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
                await this.upsertInstanceUuid(instance.parentUuid, instance);
              }
            }
            break;
          }
          case "delete":{
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await this.deleteInstanceUuid(instanceCollection.parentUuid, instance)
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
        modelCUDupdate.objects[0].parentUuid,
        "name",
        modelCUDupdate.objects[0].parentName,
        "not found!"
      );
    }
  }
}
