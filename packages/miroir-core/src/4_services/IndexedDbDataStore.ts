
import { modelInitialize } from "src/3_controllers/ModelInitializer";
import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition";
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { ModelReplayableUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import entityEntity from "../assets/entities/EntityEntity.json";
import entityEntityDefinition from "../assets/entities/EntityEntityDefinition.json";
import { IndexedDb } from "./indexedDb";
import { entityDefinitionEntityDefinition } from "src";

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
    await modelInitialize(this);
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
  async createEntity(entity:MetaEntity, entityDefinition: EntityDefinition) {
    if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
      console.log('IndexedDbDataStore upsertInstance create sublevel',entity.uuid, 'for', entity.name);
      this.localUuidIndexedDb.addSubLevels([entity.uuid]);
      this.upsertInstance(entityEntity.uuid, entity);
      if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
      } else {
        console.warn('IndexedDbDataStore createEntity sublevel for entityEntityDefinition does not exist',entityEntityDefinition.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid));
      }
    } else {
      console.warn('IndexedDbDataStore createEntity already existing sublevel',entity.uuid,this.localUuidIndexedDb.hasSubLevel(entity.uuid));
    }
  }

  // #############################################################################################
  async dropEntity(entityUuid:string):Promise<void> {
    if (this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
      this.localUuidIndexedDb.removeSubLevels([entityUuid]);
    } else {
      console.warn('dropEntity entity not found:', entityUuid);
    }
    if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
      await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);
    } else {
      console.warn('IndexedDbDataStore dropEntity sublevel for entityEntity does not exist',entityEntity.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid));
    }

    if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
      await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);

      const entityDefinitions = (await this.getInstances(entityEntityDefinition.uuid) as EntityDefinition[]).filter(i=>i.entityUuid == entityUuid)
      for (
        const entityDefinition of entityDefinitions
      ) {
        await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition)
      }
    } else {
      console.warn('IndexedDbDataStore createEntity sublevel for entityEntityDefinition does not exist',entityEntityDefinition.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid));
    }

  }

  // #############################################################################################
  dropEntities(entityUuids:string[]) {
    entityUuids.forEach(e =>this.dropEntity(e));
  }

  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstance[]}>{
    let result = {};
    console.log('getState this.getEntities()',this.getEntities());
    
    for (const parentUuid of this.getEntities()) {
      console.log('getState getting instances for',parentUuid);
      const instances = await this.getInstances(parentUuid);
      console.log('getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }
  
  // #############################################################################################
  async getInstances(parentUuid:string):Promise<any> {
    return this.localUuidIndexedDb.getAllValue(parentUuid);
  }
  
  // #############################################################################################
  async upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore upsertInstance',instance.parentUuid, instance);

    // if (instance.parentUuid == entityDefinitionEntityDefinition.uuid && !this.localUuidIndexedDb.hasSubLevel(instance.parentUuid)) {
    // if (!this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
    //   console.log('IndexedDbDataStore upsertInstance create sublevel',parentUuid);
    //   this.localUuidIndexedDb.addSubLevels([parentUuid]);
    // } else {
    //   console.log('IndexedDbDataStore upsertInstance existing sublevel',parentUuid,this.localUuidIndexedDb.hasSubLevel(parentUuid));
    // }
    if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      return this.localUuidIndexedDb.putValue(parentUuid,instance);
    } else {
      console.error('IndexedDbDataStore upsertInstance',instance.parentUuid,'does not exists.');
      return undefined;
    }
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
            // const deleteStructureUpdate = modelEntityUpdate as ModelEntityUpdateDeleteMetaModelInstance;
            // await this.deleteInstance(deleteStructureUpdate.entityUuid,{uuid:deleteStructureUpdate.instanceUuid} as EntityInstance)
            await this.dropEntity(update.modelEntityUpdate.entityUuid)
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
