
import { DataStoreApplicationType, metamodelEntities, modelInitialize } from "../3_controllers/ModelInitializer";
import { EntityDefinition, MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { EntityInstance, EntityInstanceCollection } from "../0_interfaces/1_core/Instance";
import { ModelReplayableUpdate, WrappedModelEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { StoreControllerInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import entityEntity from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { IndexedDb } from "./indexedDb";
import { applyModelEntityUpdate } from "../3_controllers/ModelActionRunner";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model";
import { Application } from "../0_interfaces/1_core/Application.js";

export class IndexedDbDataStore implements StoreControllerInterface{
  private logHeader: string;

  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private localUuidIndexedDb: IndexedDb,
  ){
    this.logHeader = 'IndexedDbDataStore' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
  }

  // bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
  //   throw new Error("Method not implemented.");
  // }

  getEntityNames(): string[] {
    return []
  }

  getEntityUuids(): string[] {
    return []
  }

  dropData(): Promise<void> {
    return Promise.resolve()
  }

  
  // #############################################################################################
  async dropModelAndData(metaModel: MiroirMetaModel):Promise<void>{
    await this.clear(metaModel);
  }

  // #############################################################################################
  async initApplication(
    metaModel:MiroirMetaModel,
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<void>{
    await modelInitialize(
      metaModel,
      this,
      dataStoreType,
      application,
      applicationDeployment,
      applicationModelBranch,
      applicationVersion,
      applicationStoreBasedConfiguration,
    );
    return Promise.resolve();
  }

  // #############################################################################################
  async bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ):Promise<void> {
    console.log(this.logHeader,'bootFromPersistedState does nothing!');
    
    // await this.localUuidIndexedDb.createObjectStore([]);
    return Promise.resolve();
  }

  // #############################################################################################
  async open():Promise<void> {
    console.log(this.logHeader,'open(): opening');
    await this.localUuidIndexedDb.openObjectStore();
    console.log(this.logHeader,'open(): opened');
    return Promise.resolve();
  }
  
  // ##############################################################################################
  async close():Promise<void> {
    console.log(this.logHeader,'close() does nothing!');
    // TODO: close does not work, gives an error after test executes!!
    // await this.localUuidIndexedDb.closeObjectStore();
    return Promise.resolve();
  }

  // ##############################################################################################
  async clear(metaModel: MiroirMetaModel):Promise<void> {
    console.log(this.logHeader,'clear',this.getEntities());
    // await this.localUuidIndexedDb.clearObjectStore();
    // await this.dropEntities(this.getEntities());
    this.localUuidIndexedDb.removeSubLevels(this.getEntities())
    return Promise.resolve();
  }

  // #############################################################################################
  getEntities(): string[] {
    return this.localUuidIndexedDb.getSubLevels();
  }

  // #############################################################################################
  async createStorageSpaceForInstancesOfEntity(entity:MetaEntity, entityDefinition: EntityDefinition) {
    // console.warn('IndexedDbDataStore createStorageSpaceForInstancesOfEntity does nothing: IndexedDbDataStore is not persistent.');
    console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity','input: entity',entity,'entityDefinition',entityDefinition, 'Entities',this.localUuidIndexedDb.getSubLevels());
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error(this.logHeader,'createStorageSpaceForInstancesOfEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'inconsistent input: given entityDefinition is not related to given entity.');
    } else {
      if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
        this.localUuidIndexedDb.addSubLevels([entity.uuid]);
      } else {
        this.localUuidIndexedDb.db?.sublevel(entity.uuid).clear();
        console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity','input: entity',entity,'entityDefinition',entityDefinition, 'already has entity. Existing entities:',this.localUuidIndexedDb.getSubLevels());
      }
    }
    return Promise.resolve();
  }


  renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition):Promise<void> {
    throw new Error("Method not implemented.");
  }

  dropStorageSpaceForInstancesOfEntity(entityUuid:Uuid):Promise<void> {
    throw new Error("Method not implemented.");
  }

  // #############################################################################################
  async createEntity(entity:MetaEntity, entityDefinition: EntityDefinition) {
    if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
      console.log('IndexedDbDataStore createEntity create sublevel',entity.uuid, 'for', entity.name);
      this.localUuidIndexedDb.addSubLevels([entity.uuid]);
      await this.upsertModelInstance(entityEntity.uuid, entity);
      if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        await this.upsertDataInstance(entityEntityDefinition.uuid, entityDefinition);
      } else {
        console.warn(this.logHeader,'IndexedDbDataStore createEntity sublevel for entityEntityDefinition does not exist',entityEntityDefinition.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid));
      }
    } else {
      console.log(this.logHeader,'IndexedDbDataStore createEntity already existing sublevel',entity.uuid,entity.name,this.localUuidIndexedDb.hasSubLevel(entity.uuid));
      this.localUuidIndexedDb.db?.sublevel(entity.uuid).clear();
    }
  }

  // #############################################################################################
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate){
    const cudUpdate = update.equivalentModelCUDUpdates[0];
    // const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
    if (cudUpdate && cudUpdate.objects[0].instances[0].parentUuid && cudUpdate.objects[0].instances[0].uuid) {
      const currentValue = await this.getDataInstance(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
      console.log('IndexedDbDataStore applyModelEntityUpdates',cudUpdate.objects[0].instances[0].parentUuid,currentValue);
      // update the instance in table Entity corresponding to the renamed entity
      // await this.localUuidIndexedDb.putValue(
      //   cudUpdate.objects[0].instances[0].parentUuid,
      //   cudUpdate.objects[0].instances[0],
      // );
      await this.upsertDataInstance(cudUpdate.objects[0].instances[0].parentUuid, cudUpdate.objects[0].instances[0]);
      const updatedValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
      console.log('IndexedDbDataStore applyModelEntityUpdates done',cudUpdate.objects[0].instances[0].parentUuid,updatedValue);
    } else {
      console.error('IndexedDbDataStore applyModelEntityUpdates incorrect parameter',cudUpdate);
    }
    return Promise.resolve();
  }
  // #############################################################################################
  async dropEntity(entityUuid:string):Promise<void> {
    if (this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
      this.localUuidIndexedDb.removeSubLevels([entityUuid]);
    } else {
      console.warn(this.logHeader,'dropEntity entity not found:', entityUuid);
    }
    if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
      await this.deleteDataInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);
    } else {
      console.warn(this.logHeader,'dropEntity sublevel for entityEntity does not exist',entityEntity.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid));
    }

    if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
      await this.deleteDataInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);

      const entityDefinitions = (await this.getDataInstances(entityEntityDefinition.uuid) as EntityDefinition[]).filter(i=>i.entityUuid == entityUuid)
      for (
        const entityDefinition of entityDefinitions
      ) {
        await this.deleteDataInstance(entityEntityDefinition.uuid, entityDefinition)
      }
    } else {
      console.warn('IndexedDbDataStore dropEntity sublevel for entityEntityDefinition does not exist',entityEntityDefinition.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid));
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async dropEntities(entityUuids:string[]) {
    // console.error(this.logHeader,'do not call dropentities!');
    
    for (const entityUuid of entityUuids) {
      await this.dropEntity(entityUuid)
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  // used only for testing purposes!
  // async getState():Promise<{[uuid:string]:EntityInstance[]}>{
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{
    let result = {};
    console.log('getState this.getEntities()',this.getEntities());
    
    for (const parentUuid of this.getEntities()) {
      console.log('getState getting instances for',parentUuid);
      const instances = await this.getDataInstances(parentUuid);
      console.log('getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }
  
  // #############################################################################################
  // async getInstances(parentUuid:string):Promise<any> {
  async getInstances(entityUuid: string): Promise<EntityInstanceCollection> {
    // TODO: fix applicationSection!!!
    const modelEntitiesUuid = this.dataStoreType == "app"?metamodelEntities.map(e=>e.uuid):[entityEntity.uuid,entityEntityDefinition.uuid];
    if (modelEntitiesUuid.includes(entityUuid)) {
      return Promise.resolve({parentUuid:entityUuid, applicationSection:'model', instances: await this.getModelInstances(entityUuid)});
    } else {
      return Promise.resolve({parentUuid:entityUuid, applicationSection:'data', instances: await this.getDataInstances(entityUuid)});
    }
    // return {parentUuid:entityUuid,applicationSection:'model',instances:await this.localUuidIndexedDb.getAllValue(entityUuid) as EntityInstance[]};
  }
  
  // #############################################################################################
  async getModelInstances(parentUuid:string):Promise<any> {
    const result = await this.localUuidIndexedDb.getAllValue(parentUuid);
    return Promise.resolve(result);
  }
  
  // #############################################################################################
  async getModelInstance(parentUuid:string,uuid:string):Promise<EntityInstance | undefined> {
    const result = await this.localUuidIndexedDb.getValue(parentUuid,uuid);
    return Promise.resolve(result);
  }
  
  // #############################################################################################
  async upsertModelInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore upsertDataInstance',instance.parentUuid, instance);

    if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      await this.localUuidIndexedDb.putValue(parentUuid,instance);
    } else {
      console.error('IndexedDbDataStore upsertDataInstance',instance.parentUuid,'does not exists.');
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteModelInstances(parentUuid:string, instances:EntityInstance[]):Promise<any> {
    console.log('IndexedDbDataStore deleteDataInstances',parentUuid, instances);
    for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteModelInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore deleteDataInstance',parentUuid, instance);
    // for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
    // }
    return Promise.resolve();
  }

  // #############################################################################################
  async getDataInstances(parentUuid:string):Promise<any> {
    const result = await this.localUuidIndexedDb.getAllValue(parentUuid);
    return Promise.resolve(result);
  }
  
  // #############################################################################################
  async getDataInstance(parentUuid:string,uuid:string):Promise<EntityInstance | undefined> {
    const result = await this.localUuidIndexedDb.getValue(parentUuid,uuid);
    return Promise.resolve(result);
  }

  // #############################################################################################
  async upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    const result = await this.upsertDataInstance(parentUuid,instance);
    return Promise.resolve(result);
  }

  // #############################################################################################
  async upsertDataInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore upsertDataInstance',instance.parentUuid, instance);

    if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      await this.localUuidIndexedDb.putValue(parentUuid,instance);
    } else {
      console.error('IndexedDbDataStore upsertDataInstance',instance.parentUuid,'does not exists.');
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteDataInstances(parentUuid:string, instances:EntityInstance[]):Promise<any> {
    console.log('IndexedDbDataStore deleteDataInstances',parentUuid, instances);
    for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteDataInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('IndexedDbDataStore deleteDataInstance',parentUuid, instance);
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
    return Promise.resolve();
  }
}
