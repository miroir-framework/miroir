
import { Application } from "../0_interfaces/1_core/Application.js";
import { EntityDefinition, MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { ApplicationSection, EntityInstance, EntityInstanceCollection } from "../0_interfaces/1_core/Instance";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model";
import { ModelReplayableUpdate, WrappedModelEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { DataStoreInterface, ModelStoreInterface, StoreControllerInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { applyModelEntityUpdate } from "../3_controllers/ModelActionRunner";
import { DataStoreApplicationType, applicationModelEntities, modelInitialize } from "../3_controllers/ModelInitializer";
import entityEntity from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { IndexedDb } from "./indexedDb";


export class IndexedDbStoreController implements StoreControllerInterface{
  private logHeader: string;

  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    // private localUuidIndexedDb: IndexedDb,
    private modelStore:ModelStoreInterface,
    private dataStore:DataStoreInterface,
  ){
    this.logHeader = 'IndexedDbStoreController' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
  }
  connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
  //   throw new Error("Method not implemented.");
  // }

  getEntityNames(): string[] {
    return this.dataStore.getEntityNames();
  }

  getEntityUuids(): string[] {
    return this.dataStore.getEntityUuids();
  }

  dropData(): Promise<void> {
    return this.dataStore.dropData();
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
    return Promise.resolve();
  }

  // #############################################################################################
  async open():Promise<void> {
    await this.dataStore.connect(); // replace by open?
    await this.modelStore.connect();
    return Promise.resolve();
  }
  
  // ##############################################################################################
  async close():Promise<void> {
    console.log(this.logHeader,'close() does nothing!');
    // TODO: close does not work, gives an error after test executes!!
    return Promise.resolve();
  }

  // ##############################################################################################
  async clear(metaModel: MiroirMetaModel):Promise<void> {
    console.log(this.logHeader,'clear',this.getEntities());
    // await this.dataStore.dropData(metaModel);
    await this.modelStore.dropModelAndData(metaModel);
    return Promise.resolve();
  }

  // #############################################################################################
  getEntities(): string[] {
    // return this.localUuidIndexedDb.getSubLevels();
    // return this.modelStore.getEntities();
    return this.dataStore.getEntityUuids();
  }

  // #############################################################################################
  getModelEntities(): string[] {
    // return this.localUuidIndexedDb.getSubLevels();
    // return this.modelStore.getEntities();
    return this.modelStore.getEntities();
  }

  // ##############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.modelStore.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // #############################################################################################
  renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition):Promise<void> {
    return this.dataStore.renameStorageSpaceForInstancesOfEntity(oldName,newName,entity,entityDefinition);
  }

  // #############################################################################################
  dropStorageSpaceForInstancesOfEntity(entityUuid:Uuid):Promise<void> {
    return this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
  }

  // ##############################################################################################
  async createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void> {
    return this.modelStore.createEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate){
    return this.modelStore.renameEntity(update);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    return this.modelStore.dropEntity(entityUuid);
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]) {
    return this.modelStore.dropEntities(entityUuids);
  }

  // ##############################################################################################
  // used only for testing purposes!
  // async getState():Promise<{[uuid:string]:EntityInstance[]}>{
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{
    return this.dataStore.getState();
    // let result = {};
    // console.log('getState this.getEntities()',this.getEntities());
    
    // for (const parentUuid of this.getEntities()) {
    //   console.log('getState getting instances for',parentUuid);
    //   const instances = await this.getDataInstances(parentUuid);
    //   console.log('getState found instances',parentUuid,instances);
      
    //   Object.assign(result,{[parentUuid]:instances});
    // }
    // return Promise.resolve(result);
  }
  
  // #############################################################################################
  // async getInstances(parentUuid:string):Promise<any> {
  async getInstances(section: ApplicationSection, entityUuid: string): Promise<EntityInstanceCollection> {
    // TODO: fix applicationSection!!!
    const modelEntitiesUuid = this.dataStoreType == "app"?applicationModelEntities.map(e=>e.uuid):[entityEntity.uuid,entityEntityDefinition.uuid];
    console.log(this.logHeader,'getInstances','section',section,'entity',entityUuid,'found modelEntities',modelEntitiesUuid);

    
    // if (modelEntitiesUuid.includes(entityUuid)) {
    if (section == 'data') {
      return Promise.resolve({parentUuid:entityUuid, applicationSection:'data', instances: await this.getDataInstances(entityUuid)});
    } else {
      return Promise.resolve({parentUuid:entityUuid, applicationSection:'model', instances: await this.getModelInstances(entityUuid)});
    }
    // return {parentUuid:entityUuid,applicationSection:'model',instances:await this.localUuidIndexedDb.getAllValue(entityUuid) as EntityInstance[]};
  }
  
  // ##############################################################################################
  async upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>{
    console.log(this.logHeader,'upsertInstance','section',section,'type',this.dataStoreType,'instance',instance,'model entities',this.getModelEntities(),'data entities',this.getEntities());
    
    // if (this.getEntities().includes(parentUuid)) {
    if (section == 'data') {
      await this.upsertDataInstance(instance.parentUuid,instance);
    } else {
      await this.upsertModelInstance(instance.parentUuid,instance);
    }
    return Promise.resolve(instance);
  }

  // ##############################################################################################
  async deleteInstances(section: ApplicationSection, parentUuid:string, instances:EntityInstance[]):Promise<any>{
    for (const instance of instances) {
      if (section == 'data') {
        await this.deleteDataInstance(parentUuid,instance);
      } else {
        await this.deleteModelInstance(parentUuid,instance);
      }
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async getModelInstances(parentUuid: string): Promise<EntityInstance[]> {
    return this.modelStore.getModelInstances(parentUuid);
  }

  // // #############################################################################################
  // async getModelInstance(parentUuid:string,uuid:string):Promise<EntityInstance | undefined> {
  //   const result = await this.localUuidIndexedDb.getValue(parentUuid,uuid);
  //   return Promise.resolve(result);
  // }
  
  // ##############################################################################################
  async upsertModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.modelStore.upsertModelInstance(parentUuid,instance)
  }

  // ##############################################################################################
  async deleteModelInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return this.modelStore.deleteModelInstances(parentUuid,instances);
  }

  // ##############################################################################################
  async deleteModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.modelStore.deleteModelInstance(parentUuid,instance);
  }

  // ##############################################################################################
  async getDataInstances(parentUuid: string): Promise<EntityInstance[]> {
    return this.dataStore.getDataInstances(parentUuid);
  }

  // ##############################################################################################
  async getDataInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    return this.dataStore.getDataInstance(parentUuid,uuid);
  }

  // // #############################################################################################
  // async upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
  //   const result = await this.upsertDataInstance(parentUuid,instance);
  //   return Promise.resolve(result);
  // }

  // ##############################################################################################
  async upsertDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.dataStore.upsertDataInstance(parentUuid,instance);
  }

  // ##############################################################################################
  async deleteDataInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return this.dataStore.deleteDataInstances(parentUuid,instances);
  }

  // ##############################################################################################
  async deleteDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.dataStore.deleteDataInstance(parentUuid,instance);
  }

  // ##############################################################################################
  existsEntity(entityUuid:string):boolean {
    return this.modelStore.existsEntity(entityUuid);
  }
  
  // ##############################################################################################
  async applyModelEntityUpdate(update:ModelReplayableUpdate){
    console.log('IndexedDbStoreController applyModelEntityUpdate',update);
    await applyModelEntityUpdate(this,update);
    return Promise.resolve();
  }
}
