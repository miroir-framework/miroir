
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { ModelEntityUpdateDeleteMetaModelInstance, ModelReplayableUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import entityEntity from "../assets/entities/EntityEntity.json";
import entityEntityDefinition from "../assets/entities/EntityEntityDefinition.json";
import { IndexedDb } from "./indexedDb";

export class IndexedDbDataStore implements DataStoreInterface{
  constructor(
    private localUuidIndexedDb: IndexedDb,
  ){}

  public getdb():any{
    return this.localUuidIndexedDb.db;
  }

  // #############################################################################################
  async dropModel():Promise<void>{
    return this.clear();
  }

  // #############################################################################################
  async initModel():Promise<void>{
    // return this.clear();
  }

  // #############################################################################################
  async start():Promise<void> {
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
    // this.dropEntities(this.getEntities());
  }

  // #############################################################################################
  getEntityDefinitions(): string[] {
      return this.localUuidIndexedDb.getSubLevels();
  }

  // #############################################################################################
  getEntities(): string[] {
    //TODO: implement!!
      return this.localUuidIndexedDb.getSubLevels();
  }

  // #############################################################################################
  dropEntity(parentUuid:string) {
    if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      this.localUuidIndexedDb.removeSubLevels([parentUuid]);
    } else {
      console.warn('dropEntity parentName not found:', parentUuid);
    } 
  }

  // #############################################################################################
  dropEntities(entityUuids:string[]) {
    entityUuids.forEach(e =>this.dropEntity(e));
  }
  
  // #############################################################################################
  getInstances(parentUuid:string):Promise<any> {
    return this.localUuidIndexedDb.getAllValue(parentUuid);
  }
  
  // #############################################################################################
  upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore upsertInstance',instance.parentUuid, instance);

    // if (instance.parentUuid == entityDefinitionEntityDefinition.uuid && !this.localUuidIndexedDb.hasSubLevel(instance.parentUuid)) {
    if (!this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      console.log('IndexedDbDataStore upsertInstance create sublevel',parentUuid);
      this.localUuidIndexedDb.addSubLevels([parentUuid]);
    } else {
      console.log('IndexedDbDataStore upsertInstance existing sublevel',parentUuid,this.localUuidIndexedDb.hasSubLevel(parentUuid));
    }

    return this.localUuidIndexedDb.putValue(parentUuid,instance);
  }

  // #############################################################################################
  async deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<any> {
    console.log('IndexedDbDataStore deleteInstances',parentUuid, instances);
    for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore deleteInstance',parentUuid, instance);
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
            await this.deleteInstance(deleteStructureUpdate.parentUuid,{uuid:deleteStructureUpdate.instanceUuid} as EntityInstance)
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
            for (const instance of update.modelEntityUpdate.entities) {
              // await this.upsertInstance(modelEntityUpdate.parentUuid, instance);
              console.log('IndexedDbDataStore applyModelEntityUpdates createEntity inserting',instance);
              await this.localUuidIndexedDb.putValue(entityEntity.uuid, instance.entity);
              await this.localUuidIndexedDb.putValue(entityEntityDefinition.uuid, instance.entityDefinition);
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
                await this.upsertInstance(instance.parentUuid, instance);
              }
            }
            break;
          }
          case "delete":{
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await this.deleteInstance(instanceCollection.parentUuid, instance)
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
