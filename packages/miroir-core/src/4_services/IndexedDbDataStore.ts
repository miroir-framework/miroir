
import { modelInitialize } from "src/3_controllers/ModelInitializer";
import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition";
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { ModelReplayableUpdate, WrappedModelEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import entityEntity from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { IndexedDb } from "./indexedDb";
import { applyModelEntityUpdate } from "../3_controllers/ModelActionRunner";

export class IndexedDbDataStore implements DataStoreInterface{
  constructor(
    private localUuidIndexedDb: IndexedDb,
  ){}

  // #############################################################################################
  async dropModel():Promise<void>{
    return this.clear();
  }

  // #############################################################################################
  async initModel():Promise<void>{
    await modelInitialize(this);
    return Promise.resolve(undefined);
    // return this.clear();
  }

  // #############################################################################################
  async start():Promise<void> {
    await this.localUuidIndexedDb.createObjectStore([]);
    return Promise.resolve();
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
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate){
    const cudUpdate = update.equivalentModelCUDUpdates[0];
    // const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
    const currentValue = await this.getInstance(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
    console.log('IndexedDbDataStore applyModelEntityUpdates',cudUpdate.objects[0].instances[0].parentUuid,currentValue);
    // update the instance in table Entity corresponding to the renamed entity
    // await this.localUuidIndexedDb.putValue(
    //   cudUpdate.objects[0].instances[0].parentUuid,
    //   cudUpdate.objects[0].instances[0],
    // );
    await this.upsertInstance(cudUpdate.objects[0].instances[0].parentUuid, cudUpdate.objects[0].instances[0]);
    const updatedValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
    console.log('IndexedDbDataStore applyModelEntityUpdates done',cudUpdate.objects[0].instances[0].parentUuid,updatedValue);
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
  async getInstance(parentUuid:string,uuid:string):Promise<EntityInstance> {
    return this.localUuidIndexedDb.getValue(parentUuid,uuid);
  }
  
  // #############################################################################################
  async upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore upsertInstance',instance.parentUuid, instance);

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
  existsEntity(entityUuid:string):boolean {
    return this.localUuidIndexedDb.hasSubLevel(entityUuid);
  }
  
  // ##############################################################################################
  async applyModelEntityUpdate(update:ModelReplayableUpdate){
    console.log('IndexedDbDataStore applyModelEntityUpdate',update);
    await applyModelEntityUpdate(this,update);
  }
}
